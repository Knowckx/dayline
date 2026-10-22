import { createTodo, updateTodo, type Todo, type TodoCreateInput } from './todo';
import { loadTodos, saveTodo, saveTodos } from './todo_storage';
import { loadTodoCompletions, saveTodoCompletions, type TodoCompletionTable } from './todo_completion_storage';

interface TodoState {
	todos: Todo[]; // 当前内存中的待办集合。
	completions: TodoCompletionTable; // 按本地日期分组的已完成待办与完成时间。
	loadError: string; // 本地数据读取失败信息。
}

/** 页面间共享的待办响应式状态。 */
export const todoState = $state<TodoState>({
	todos: [],
	completions: {},
	loadError: ''
});

/** 从本地存储刷新共享状态。 */
export function refreshTodos(): void {
	try {
		const todos = loadTodos(); // 本次刷新的待办规则。
		const completions = loadTodoCompletions(); // 与本次刷新配套的持久化完成记录。
		todoState.todos = todos;
		todoState.completions = completions;
		todoState.loadError = '';
	} catch (error) {
		todoState.loadError = getErrorMessage(error, '读取待办失败');
	}
}

/** 创建、保存待办并同步共享状态。 */
export function addTodo(input: TodoCreateInput): Todo {
	const todo = createTodo(input);
	todoState.todos = saveTodo(todo);
	todoState.loadError = '';
	return todo;
}

/** 按标题跳过已有待办，批量追加缺失项；配置错误标明条目，存储错误继续抛出。 */
export function addTodos(inputs: TodoCreateInput[]): Todo[] {
	const todos = loadTodos(); // 当前存储中的完整待办集合。
	const titles = new Set<string>(); // 用于过滤预设的已有标题，按完整字符串匹配。
	for (const todo of todos) titles.add(todo.title);
	const created: Todo[] = []; // 本次创建的待办，全部创建成功后再保存。
	for (let index = 0; index < inputs.length; index += 1) {
		const input = inputs[index]; // 当前配置条目，序号用于定位错误。
		if (titles.has(input.title)) continue;
		try {
			created.push(createTodo(input));
		} catch (error) {
			throw new Error(`预设第 ${index + 1} 条“${input.title}”配置错误：${getErrorMessage(error, '无法创建待办')}`);
		}
	}
	if (created.length === 0) return created;

	todos.push(...created);
	saveTodos(todos);
	todoState.todos = todos;
	todoState.loadError = '';
	return created;
}

/** 修改指定待办的表单字段和重复规则。 */
export function editTodo(id: string, input: TodoCreateInput): Todo {
	const todos = loadTodos();
	const index = findTodoIndex(todos, id);
	if (index < 0) throw new Error('待办不存在或已被删除');

	const updatedTodo = updateTodo(todos[index], input);
	todos[index] = updatedTodo;
	saveTodos(todos);
	todoState.todos = todos;
	todoState.loadError = '';
	return updatedTodo;
}

/** 永久删除指定待办。 */
export function deleteTodo(id: string): void {
	const todos = loadTodos();
	const index = findTodoIndex(todos, id);
	if (index < 0) throw new Error('待办不存在或已被删除');

	todos.splice(index, 1);
	saveTodos(todos);
	todoState.todos = todos;
	todoState.loadError = '';
}

/** 清空全部待办，存储成功后同步共享状态；保留独立的时间记录。 */
export function clearTodos(): void {
	saveTodos([]);
	todoState.todos = [];
	todoState.loadError = '';
}

/** 设置指定本地日期的完成状态；重复完成保留原时间，取消完成删除记录，保存成功后同步状态。 */
export function setTodoCompleted(date: string, todoId: string, completed: boolean): void {
	const completions = loadTodoCompletions(); // 以当前存储为基准修改完成记录。
	const day = completions[date] ?? {}; // 指定日期已完成的待办及其时间。
	if (completed) day[todoId] ??= new Date().toISOString();
	else delete day[todoId];
	completions[date] = day;
	saveTodoCompletions(completions);
	todoState.completions = completions;
}

/** 查找指定待办在集合中的位置。 */
function findTodoIndex(todos: Todo[], id: string): number {
	for (let index = 0; index < todos.length; index += 1) {
		if (todos[index].id === id) return index;
	}
	return -1;
}

/** 提取可直接展示的错误信息。 */
function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}
