<script lang="ts">
	import { CalendarCheck, ChevronRight } from '@lucide/svelte';
	import { Tip } from '@knowckx/infa-s5';
	import TodoDetailDialog from '@/lib/components/TodoDetailDialog.svelte';
	import { isDateTodo, toLocalDate, type DateTodo, type DateTodoInput } from '@/lib/todos/todo';
	import { deleteTodo, editTodo, todoState } from '@/lib/todos/todo_state.svelte';

	interface TodoGroup {
		dateKey: string; // 本地日期分组键。
		label: string; // 分组标题。
		todos: DateTodo[]; // 分组内按时间升序排列的指定日期待办。
	}

	let selectedTodoId = $state<string | null>(null); // 当前打开详情的待办 ID。
	let dateTodos = $derived(todoState.todos.filter(isDateTodo)); // 当前界面支持的指定日期待办。
	let todoGroups = $derived(groupTodosByDate([...dateTodos].sort(compareTodoTime))); // 按日期分组的待办。
	let selectedTodo = $derived(findTodoById(dateTodos, selectedTodoId)); // 当前打开详情的最新模型。

	/** 打开一条待办的详情。 */
	function openTodoDetail(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		selectedTodoId = button.dataset.todoId ?? null;
	}

	/** 关闭待办详情。 */
	function closeTodoDetail() {
		selectedTodoId = null;
	}

	/** 保存当前待办的编辑内容。 */
	function saveSelectedTodo(input: DateTodoInput): boolean {
		if (!selectedTodoId) return false;

		try {
			editTodo(selectedTodoId, input);
			Tip.success('待办已更新');
			return true;
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '更新待办失败');
			return false;
		}
	}

	/** 永久删除当前待办。 */
	function deleteSelectedTodo() {
		if (!selectedTodoId) return;

		try {
			deleteTodo(selectedTodoId);
			selectedTodoId = null;
			Tip.success('待办已删除');
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '删除待办失败');
		}
	}

	/** 按 ID 获取当前共享状态中的待办。 */
	function findTodoById(todos: DateTodo[], id: string | null): DateTodo | null {
		if (!id) return null;
		for (const todo of todos) {
			if (todo.id === id) return todo;
		}
		return null;
	}

	/** 比较两条待办的计划时间。 */
	function compareTodoTime(left: DateTodo, right: DateTodo): number {
		return toLocalDate(left).getTime() - toLocalDate(right).getTime();
	}

	/** 将待办按本地日期分组。 */
	function groupTodosByDate(todos: DateTodo[]): TodoGroup[] {
		const groups = new Map<string, TodoGroup>();
		for (const todo of todos) {
			const dateKey = todo.scheduledAt.slice(0, 10);
			let group = groups.get(dateKey);

			if (!group) {
				group = { dateKey, label: formatGroupLabel(todo), todos: [] };
				groups.set(dateKey, group);
			}

			group.todos.push(todo);
		}
		return Array.from(groups.values());
	}

	/** 生成本地 YYYY-MM-DD 日期键。 */
	function formatLocalDateKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/** 生成今天、明天或普通日期分组标题。 */
	function formatGroupLabel(todo: DateTodo): string {
		const today = new Date();
		const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		const dateKey = todo.scheduledAt.slice(0, 10);
		if (dateKey === formatLocalDateKey(today)) return '今天';
		if (dateKey === formatLocalDateKey(tomorrow)) return '明天';
		return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(toLocalDate(todo));
	}

</script>

<main class="h-full overflow-y-auto bg-slate-50 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
	<div class="mx-auto max-w-2xl">
		<header class="px-1">
			<h1 class="text-2xl font-bold tracking-tight">待办库</h1>
			<p class="mt-1 text-sm text-slate-500">共 {dateTodos.length} 项待办</p>
		</header>

		{#if todoState.loadError}
			<div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
				{todoState.loadError}
			</div>
		{:else if todoGroups.length === 0}
			<section class="mt-16 flex flex-col items-center px-6 text-center">
				<div class="grid size-14 place-items-center rounded-full bg-sky-100 text-sky-600">
					<CalendarCheck size={28} />
				</div>
			<h2 class="mt-4 text-base font-semibold">当前没有待办</h2>
				<p class="mt-1 text-sm text-slate-500">点击底部中央按钮添加一条待办</p>
			</section>
		{:else}
			<div class="mt-6 space-y-6">
				{#each todoGroups as group (group.dateKey)}
					<section aria-labelledby={`todo-group-${group.dateKey}`}>
						<h2 id={`todo-group-${group.dateKey}`} class="mb-2 px-1 text-sm font-semibold text-slate-600">
							{group.label}
						</h2>

						<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
							{#each group.todos as todo (todo.id)}
								<article class="flex min-h-20 items-center gap-2 border-b border-slate-100 px-2 last:border-b-0">
									<button
										type="button"
										class="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left"
										data-todo-id={todo.id}
										onclick={openTodoDetail}
										aria-label={`查看“${todo.title}”详情`}
									>
										<div class="min-w-0 flex-1">
											<h3 class="truncate text-sm font-semibold">
											{todo.title}
										</h3>
										<div class="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-500">
												<time datetime={todo.scheduledAt}>{todo.scheduledAt.slice(11)}</time>
											{#if todo.body}<span class="truncate">{todo.body}</span>{/if}
										</div>
										</div>
										<ChevronRight class="shrink-0 text-slate-300" size={19} />
									</button>
								</article>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</main>

{#if selectedTodo}
	<TodoDetailDialog
		todo={selectedTodo}
		onClose={closeTodoDetail}
		onSave={saveSelectedTodo}
		onDelete={deleteSelectedTodo}
	/>
{/if}
