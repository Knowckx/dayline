<script lang="ts">
	import { untrack } from 'svelte';
	import { CalendarCheck, ChevronRight, Repeat2 } from '@lucide/svelte';
	import { getNextOccurrence, isDateTodo, toLocalDate, toTodoSchedule, type Todo } from '@/lib/todos/todo';
	import { refreshTodos, todoState } from '@/lib/todos/todo_state.svelte';

	interface Props {
		onOpenTodo: (id: string) => void; // 打开二级详情页面。
		isActive: boolean; // 待办库 Tab 是否处于激活状态。
	}

	interface TodoRow {
		todo: Todo; // 保留原始待办规则。
		occursAt: string; // 本次列表展示的本地发生时间。
		timestamp: number; // 排序使用的发生时间戳。
		isPast: boolean; // 发生日期是否早于今天。
		isToday: boolean; // 发生日期是否为今天。
	}

	interface TodoSection {
		id: string; // 分节的稳定标识。
		title: string; // 分节标题。
		titleClass: string; // 分节标题的强调样式。
		rows: TodoRow[]; // 该节按发生时间排序的待办。
	}

	let { isActive, onOpenTodo }: Props = $props();
	let referenceTime = $state(new Date()); // 进入待办库时捕获的统一计算基准。
	let todoRows = $derived(buildTodoRows(todoState.todos, referenceTime)); // 按发生时间排序的全部待办。

	let todoSections = $derived(buildTodoSections(todoRows)); // 固定顺序的三个日期区段。

	$effect(handleActivation);

	/** 每次进入待办库调用刷新入口，忽略刷新过程中读取的共享状态依赖。 */
	function handleActivation() {
		if (isActive) untrack(refreshTodoList);
	}

	/** 刷新待办库数据，并更新统一的发生时间计算基准。 */
	function refreshTodoList() {
		referenceTime = new Date();
		refreshTodos();
	}

	/** 单次保留原时间，周期从今天零点推算，保留今天已到点的事件。 */
	function buildTodoRows(todos: Todo[], now: Date): TodoRow[] {
		const rows: TodoRow[] = []; // 本次列表的展示条目。
		const todayStart = new Date(now); // 本次刷新的本地今天零点。
		todayStart.setHours(0, 0, 0, 0);
		const todayKey = toTodoSchedule(todayStart).scheduledAt.slice(0, 10); // 今天的本地日期键。
		for (const todo of todos) {
			const occurrence = getNextOccurrence(todo.scheduledAt, todo, todayStart); // 每日重复始终返回今天的设定时间。
			const occursAt = toTodoSchedule(occurrence).scheduledAt; // 展示用完整本地发生时间。
			rows.push({
				todo,
				occursAt,
				timestamp: occurrence.getTime(),
				isPast: occurrence < todayStart,
				isToday: occursAt.slice(0, 10) === todayKey
			});
		}
		return rows.sort(compareTodoTime);
	}

	/** 将已排序条目分入过期、今天和未来，保留各节内部顺序。 */
	function buildTodoSections(rows: TodoRow[]): TodoSection[] {
		const sections: TodoSection[] = [
			{ id: 'past', title: '已过期', titleClass: 'text-slate-500', rows: [] },
			{ id: 'today', title: '今天', titleClass: 'text-sky-700', rows: [] },
			{ id: 'future', title: '未来的待办', titleClass: 'text-slate-900', rows: [] }
		]; // 固定显示顺序，空节由模板隐藏。
		for (const row of rows) {
			sections[row.isPast ? 0 : row.isToday ? 1 : 2].rows.push(row);
		}
		return sections;
	}

	/** 比较两条展示记录的发生时间。 */
	function compareTodoTime(left: TodoRow, right: TodoRow): number {
		return left.timestamp - right.timestamp;
	}

	/** 从原始日期和重复规则生成周期标记，发生时间仍使用列表推算结果。 */
	function formatRepeat(todo: Todo): string {
		const month = Number(todo.scheduledAt.slice(5, 7)); // 原始规则的月份。
		const day = Number(todo.scheduledAt.slice(8, 10)); // 原始规则的日号。
		switch (todo.type_int) {
			case 10: return '';
			case 21: return '每天';
			case 22: return `每周${'日一二三四五六'[toLocalDate(todo).getDay()]}`;
			case 23: return todo.additional === 'LAST_DAY' ? '每月最后一天' : `每月 ${day} 日`;
			case 24: return `每年 ${month} 月 ${day} 日`;
		}
	}

	/** 打开一条待办的详情。 */
	function openTodoDetail(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		const id = button.dataset.todoId; // 列表行对应的原始待办。
		if (id) onOpenTodo(id);
	}

</script>

<main class="h-full overflow-y-auto bg-slate-50 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
	<div class="mx-auto max-w-2xl">
		<header class="px-1">
			<h1 class="text-2xl font-bold tracking-tight">待办库</h1>
			<p class="mt-1 text-sm text-slate-500">共 {todoRows.length} 项待办</p>
		</header>

		{#if todoState.loadError}
			<div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
				{todoState.loadError}
			</div>
		{:else if todoRows.length === 0}
			<section class="mt-16 flex flex-col items-center px-6 text-center">
				<div class="grid size-14 place-items-center rounded-full bg-sky-100 text-sky-600">
					<CalendarCheck size={28} />
				</div>
			<h2 class="mt-4 text-base font-semibold">当前没有待办</h2>
				<p class="mt-1 text-sm text-slate-500">点击底部中央按钮添加一条待办</p>
			</section>
		{:else}
			<div class="mt-6 space-y-6">
				{#each todoSections as section (section.id)}
					{#if section.rows.length > 0}
						<section aria-labelledby={`todo-section-${section.id}`}>
							<h2 id={`todo-section-${section.id}`} class={`mb-2 px-1 text-sm font-semibold ${section.titleClass}`}>{section.title}</h2>
							<div class="overflow-hidden rounded-2xl border border-slate-200 {section.id === 'past' ? 'bg-slate-100/60' : 'bg-white shadow-sm'}">
								{#each section.rows as row (row.todo.id)}
									{@const todo = row.todo}
							<article class="flex min-h-20 items-center gap-2 border-b border-slate-100 px-2 last:border-b-0">
								<button
									type="button"
									class="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left"
									data-todo-id={todo.id}
									onclick={openTodoDetail}
									aria-label={`查看“${todo.title}”详情`}
								>
									<div class="min-w-0 flex-1">
										<h3 class="truncate text-sm {row.isPast ? 'font-normal text-slate-500' : 'font-semibold'}">{todo.title}</h3>
										<div class="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
											<time class="text-sm {row.isPast ? 'text-slate-400' : ''}" class:font-medium={row.isToday} class:text-sky-700={row.isToday} datetime={row.occursAt}>
												{row.occursAt.endsWith('T00:00') ? row.occursAt.slice(0, 10) : row.isToday ? row.occursAt.slice(11, 16) : row.occursAt.replace('T', ' ')}
											</time>
											{#if !isDateTodo(todo)}
												<span class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
													<Repeat2 size={12} class="shrink-0" aria-hidden="true" />
													{formatRepeat(todo)}
												</span>
											{/if}
										</div>
									</div>
									<ChevronRight class="shrink-0 {row.isPast ? 'text-slate-300/60' : 'text-slate-300'}" size={19} />
								</button>
							</article>
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</main>
