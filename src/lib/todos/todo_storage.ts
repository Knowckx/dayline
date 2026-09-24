import { isTodo, type Todo } from './todo';

const TODO_STORAGE_KEY = 'dayline.todos'; // 当前待办集合的 localStorage 键名。

/** 读取当前待办；数据格式不兼容时重新初始化为空集合。 */
export function loadTodos(): Todo[] {
	let storedValue: string | null;
	try {
		storedValue = localStorage.getItem(TODO_STORAGE_KEY);
	} catch {
		throw new Error('无法访问本地存储，请检查浏览器设置');
	}

	if (storedValue === null) return [];

	let value: unknown;
	try {
		value = JSON.parse(storedValue);
	} catch {
		value = null;
	}

	if (Array.isArray(value) && value.every(isTodo)) return value;
	saveTodos([]);
	return [];
}

/** 将一条待办追加到本地存储，并返回最新集合。 */
export function saveTodo(todo: Todo): Todo[] {
	const todos = loadTodos();
	todos.push(todo);
	saveTodos(todos);
	return todos;
}

/** 覆盖保存完整待办集合。 */
export function saveTodos(todos: Todo[]): void {
	try {
		localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
	} catch {
		throw new Error('保存待办失败，本地存储空间可能不足');
	}
}
