import { createTodo, updateTodo, type Todo, type TodoCreateInput } from './todo';
import { loadTodos, saveTodo, saveTodos } from './todo_storage';

interface TodoState {
	todos: Todo[]; // 当前内存中的待办集合。
	loadError: string; // 本地数据读取失败信息。
}

/** 页面间共享的待办响应式状态。 */
export const todoState = $state<TodoState>({
	todos: [],
	loadError: ''
});

/** 从本地存储刷新共享状态。 */
export function refreshTodos(): void {
	try {
		todoState.todos = loadTodos();
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

/** 批量创建并追加待办，一次保存后同步共享状态；每次调用生成新 ID。 */
export function addTodos(inputs: TodoCreateInput[]): Todo[] {
	const created = inputs.map(createTodo); // 本次创建的待办。
	const todos = [...loadTodos(), ...created]; // 合并后的完整待办集合。
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
