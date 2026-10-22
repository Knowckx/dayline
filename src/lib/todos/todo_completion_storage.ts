/** 完成记录表：本地日期 → 待办 ID → 实际完成时间（ISO 字符串）。 */
export type TodoCompletionTable = Record<string, Record<string, string>>;

const COMPLETION_STORAGE_KEY = 'dayline.todo_completions'; // 独立于待办规则和今日时间记录的完成记录键名。

/** 读取完成记录，未建立时返回空表；不兼容数据按发布前策略重新初始化。 */
export function loadTodoCompletions(): TodoCompletionTable {
	let storedValue: string | null; // 本地存储中的完成记录 JSON。
	try {
		storedValue = localStorage.getItem(COMPLETION_STORAGE_KEY);
	} catch {
		throw new Error('读取待办完成记录失败，无法访问本地存储');
	}
	if (storedValue === null) return {};

	let value: unknown; // 待校验的当前结构数据。
	try {
		value = JSON.parse(storedValue);
	} catch {
		value = null;
	}
	if (isTodoCompletionTable(value)) return value;

	saveTodoCompletions({});
	return {};
}

/** 保存完整完成记录表，失败时抛出可展示的存储错误。 */
export function saveTodoCompletions(table: TodoCompletionTable): void {
	try {
		localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(table));
	} catch {
		throw new Error('保存待办完成记录失败，本地存储空间可能不足');
	}
}

/** 校验日期分组和完成时间，避免将其他结构当作当前完成记录读取。 */
function isTodoCompletionTable(value: unknown): value is TodoCompletionTable {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	for (const [date, entries] of Object.entries(value)) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
		if (typeof entries !== 'object' || entries === null || Array.isArray(entries)) return false;
		for (const completedAt of Object.values(entries)) {
			if (typeof completedAt !== 'string' || Number.isNaN(Date.parse(completedAt))) return false;
		}
	}
	return true;
}
