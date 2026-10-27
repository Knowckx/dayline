<script lang="ts">
	import { untrack } from 'svelte';
	import { CalendarCheck, Check, Repeat2 } from '@lucide/svelte';
	import { Tip } from '@knowckx/infa-s5';
	import { formatTodoRepeat, getNextOccurrence, isDateTodo, toTodoSchedule, type Todo } from '@/lib/todos/todo';
	import { moveTodoToToday, refreshTodos, setTodoCompleted, todoState } from '@/lib/todos/todo_state.svelte';

	interface Props {
		onOpenTodo: (id: string) => void; // 打开二级详情页面。
		isActive: boolean; // 待办库 Tab 是否处于激活状态。
	}

	interface TodoRow {
		todo: Todo; // 保留原始待办规则。
		occursAt: string; // 本次列表展示的本地发生时间。
		timeLabel: string; // 按相对日期和同年省略年份规则生成的展示文案。
		timestamp: number; // 排序使用的发生时间戳。
		isPast: boolean; // 发生日期是否早于今天。
		isToday: boolean; // 发生日期是否为今天。
	}

	interface TodoSection {
		id: string; // 分节的稳定标识。
		title: string; // 分节标题。
		rows: TodoRow[]; // 该节按对应展示规则排序的待办。
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

	/** 隐藏已完成的过去单次待办；其他单次保留原时间，周期从今天零点推算。 */
	function buildTodoRows(todos: Todo[], now: Date): TodoRow[] {
		const rows: TodoRow[] = []; // 本次列表的展示条目。
		const todayStart = new Date(now); // 本次刷新的本地今天零点。
		todayStart.setHours(0, 0, 0, 0);
		const todayKey = toTodoSchedule(todayStart).scheduledDate[0]; // 今天的本地日期键。
		for (const todo of todos) {
			const occurrence = getNextOccurrence(todo, todayStart); // 每日重复始终返回今天的设定时间。
			const schedule = toTodoSchedule(occurrence); // 展示用日期和时间。
			const occurrenceDate = schedule.scheduledDate[0]; // 单次待办对应原定日期。
			const isPast = occurrence < todayStart; // 本次发生日期是否早于今天。
			if (isDateTodo(todo) && isPast && todoState.completions[occurrenceDate]?.[todo.id]) continue;
			const occursAt = `${occurrenceDate}T${schedule.scheduledTime}`; // 展示用完整本地发生时间。
			rows.push({
				todo,
				occursAt,
				timeLabel: formatTodoTime(occurrence, todayStart, schedule.scheduledTime),
				timestamp: occurrence.getTime(),
				isPast,
				isToday: occurrenceDate === todayKey
			});
		}
		return rows.sort(compareTodoTime);
	}

	/** 近期优先显示相对日期，其他日期显示月日、星期及跨年年份。 */
	function formatTodoTime(occurrence: Date, todayStart: Date, time: string): string {
		const year = occurrence.getFullYear(); // 待办发生年份。
		const month = occurrence.getMonth(); // 待办发生月份，从零开始。
		const day = occurrence.getDate(); // 待办发生日号。
		const dayOffset = (
			Date.UTC(year, month, day)
			- Date.UTC(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate())
		) / 86_400_000; // 按本地日历日期计算天数差，避开夏令时的小时差。
		if (dayOffset === 0) return time === '00:00' ? '今天' : time;

		const weekday = '日一二三四五六'[occurrence.getDay()]; // 待办发生日期的中文星期。
		const remainingWeekDays = 7 - (todayStart.getDay() || 7); // 周一至周日定义下，本周剩余天数。
		const yearLabel = year === todayStart.getFullYear() ? '' : `${year}年`; // 其他日期仅跨年显示年份。
		let dateLabel = `${yearLabel}${month + 1}月${day}日 周${weekday}`; // 过期或较远日期的明确日期文案。
		if (dayOffset === -1) dateLabel = '昨天';
		else if (dayOffset === -2) dateLabel = '前天';
		else if (dayOffset < -2) dateLabel = `逾期 ${-dayOffset} 天 · ${yearLabel}${month + 1}月${day}日`;
		else if (dayOffset === 1) dateLabel = '明天';
		else if (dayOffset === 2) dateLabel = '后天';
		else if (dayOffset > 0 && dayOffset <= remainingWeekDays) dateLabel = `本周${weekday}`;
		return time === '00:00' ? dateLabel : `${dateLabel} ${time}`;
	}

	/** 分入三个日期区段，仅今日待办按完成状态和完成时间重新排列。 */
	function buildTodoSections(rows: TodoRow[]): TodoSection[] {
		const sections: TodoSection[] = [
			{ id: 'past', title: '逾期待办', rows: [] },
			{ id: 'today', title: '今日待办', rows: [] },
			{ id: 'future', title: '未来待办', rows: [] }
		]; // 固定显示顺序，仅隐藏空的非今日分节。
		for (const row of rows) {
			sections[row.isPast ? 0 : row.isToday ? 1 : 2].rows.push(row);
		}
		sections[1].rows.sort(compareTodayCompletion);
		return sections;
	}

	/** 已完成按完成时间升序置前；未完成返回相等，保留原有发生时间顺序。 */
	function compareTodayCompletion(left: TodoRow, right: TodoRow): number {
		const leftCompletedAt = todoState.completions[left.occursAt.slice(0, 10)]?.[left.todo.id]; // 左侧待办当日的完成时间。
		const rightCompletedAt = todoState.completions[right.occursAt.slice(0, 10)]?.[right.todo.id]; // 右侧待办当日的完成时间。
		if (!leftCompletedAt) return rightCompletedAt ? 1 : 0;
		if (!rightCompletedAt) return -1;
		return Date.parse(leftCompletedAt) - Date.parse(rightCompletedAt);
	}

	/** 比较两条展示记录的发生时间。 */
	function compareTodoTime(left: TodoRow, right: TodoRow): number {
		return left.timestamp - right.timestamp;
	}

	/** 按本行发生日期保存完成记录，保存失败恢复原勾选并提示原因。 */
	function handleCompletionChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement; // 本次操作的圆形复选框。
		const date = input.dataset.date!; // 与列表发生时间一致的本地日期。
		const todoId = input.dataset.todoId!; // 本行对应的原始待办 ID。
		try {
			setTodoCompleted(date, todoId, input.checked);
		} catch (error) {
			input.checked = Boolean(todoState.completions[date]?.[todoId]);
			Tip.error(error instanceof Error ? error.message : '保存待办完成状态失败');
		}
	}

	/** 将逾期待办移到今天，成功后刷新分组，失败时保留原列表并提示原因。 */
	function handleMoveTodoToToday(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement; // 当前点击的移动入口。
		const id = button.dataset.todoId!; // 要移动的逾期待办。
		try {
			moveTodoToToday(id);
			refreshTodoList();
			Tip.success('已移到今天');
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '移动待办失败');
		}
	}

	/** 打开一条待办的详情。 */
	function openTodoDetail(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		const id = button.dataset.todoId; // 列表行对应的原始待办。
		if (id) onOpenTodo(id);
	}

</script>

<div class="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900">
	<header class="todo-library-header relative z-10 shrink-0 bg-white px-3 py-6 sm:px-6">
		<div class="mx-auto flex max-w-2xl items-center gap-2 px-1">
			<h1 class="text-2xl font-bold tracking-tight">待办库</h1>
			<span class="rounded-[10px] bg-[#f0f0f0] px-2 py-0.5 text-xs leading-4 text-[#595959]" aria-label={`共 ${todoRows.length} 项待办`}>{todoRows.length}</span>
		</div>
	</header>

	<main class="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-3 pt-6 pb-5 sm:px-6 sm:pb-8">
		{#if todoState.loadError}
			<div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
				{todoState.loadError}
			</div>
		{:else}
			<div class="space-y-6">
				{#each todoSections as section (section.id)}
					{#if section.id === 'today' || section.rows.length > 0}
						<section aria-labelledby={`todo-section-${section.id}`}>
							<h2 id={`todo-section-${section.id}`} class="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-[15px] font-bold text-slate-800">
								<span class="inline-flex items-center gap-[6px] whitespace-nowrap">
									<span class="size-[6px] shrink-0 rounded-full {section.id === 'past' ? 'bg-orange-500' : section.id === 'today' ? 'bg-sky-500' : 'bg-slate-400'}" aria-hidden="true"></span>
									<span>{section.title} <span class="font-normal text-slate-500">({section.rows.length})</span></span>
								</span>
								{#if section.id === 'today'}
									<span class="whitespace-nowrap font-normal text-slate-500">
										· {referenceTime.getMonth() + 1}月{referenceTime.getDate()}日 周{'日一二三四五六'[referenceTime.getDay()]}
									</span>
								{/if}
							</h2>
							<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
								{#each section.rows as row (row.todo.id)}
									{@const todo = row.todo}
									{@const occurrenceDate = row.occursAt.slice(0, 10)}
									{@const isCompleted = (row.isToday || row.isPast) && Boolean(todoState.completions[occurrenceDate]?.[todo.id])}
							<article class="flex min-h-[72px] items-stretch border-b border-slate-100 px-1 last:border-b-0">
								{#if row.isToday || row.isPast}
									<label class="flex min-h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
										<input
											type="checkbox"
											class="peer sr-only"
											data-date={occurrenceDate}
											data-todo-id={todo.id}
											checked={isCompleted}
											onchange={handleCompletionChange}
											aria-label={`${isCompleted ? '取消完成' : '完成'}“${todo.title}”`}
										/>
										<span class="todo-check grid size-[22px] place-items-center rounded-full border-2 border-slate-300 text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500" class:completed={isCompleted} aria-hidden="true">
											<Check size={14} />
										</span>
									</label>
								{/if}
								<button
									type="button"
									class="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
									data-todo-id={todo.id}
									onclick={openTodoDetail}
									aria-label={`查看“${todo.title}”详情`}
								>
									<div class="min-w-0 flex-1">
										<h3 class="truncate text-sm font-semibold transition-colors duration-100" class:text-slate-500={isCompleted} class:line-through={isCompleted}>{todo.title}</h3>
										<div class="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
											<time class="text-sm {row.isPast ? 'text-orange-700' : ''}" class:font-medium={row.isToday} class:text-sky-700={row.isToday} datetime={row.occursAt}>
												{row.timeLabel}
											</time>
											{#if !isDateTodo(todo)}
												<span class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
													<Repeat2 size={12} class="shrink-0" aria-hidden="true" />
													{formatTodoRepeat(todo)}
												</span>
											{/if}
										</div>
									</div>
								</button>
								{#if row.isPast}
									<button
										type="button"
										class="group my-auto inline-flex min-h-11 shrink-0 items-center rounded-full px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
										data-todo-id={todo.id}
										onclick={handleMoveTodoToToday}
										aria-label={`将“${todo.title}”移到今天`}
									>
										<span class="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-neutral-200 bg-neutral-100 px-2.5 text-xs font-medium text-neutral-600 transition duration-100 group-hover:border-neutral-300 group-hover:bg-neutral-200 group-active:scale-95 motion-reduce:transform-none motion-reduce:transition-none">移到今天</span>
									</button>
								{/if}
							</article>
								{:else}
									<p class="flex min-h-12 items-center gap-2 px-4 py-3 text-sm text-slate-500">
										<CalendarCheck size={18} class="shrink-0 text-emerald-600" aria-hidden="true" />
										<span>今天暂无待办，轻松一下吧！</span>
									</p>
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.todo-library-header {
		box-shadow: 0 2px 8px rgba(126, 200, 227, 0.08);
	}

	.todo-check {
		transition: background-color 100ms ease-out, border-color 100ms ease-out;
	}

	.todo-check :global(svg) {
		opacity: 0;
		transform: scale(0.6);
		transition: opacity 100ms ease-out, transform 100ms ease-out;
	}

	.todo-check.completed {
		border-color: var(--color-sky-500);
		background-color: var(--color-sky-500);
		animation: complete-pop 100ms ease-out;
	}

	.todo-check.completed :global(svg) {
		opacity: 1;
		transform: scale(1);
	}

	@keyframes complete-pop {
		0% { transform: scale(0.85); }
		60% { transform: scale(1.12); }
		100% { transform: scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.todo-check,
		.todo-check :global(svg) {
			animation: none;
			transition: none;
		}
	}
</style>
