/** 待办使用的本地日期时间，格式为 YYYY-MM-DDTHH:mm。 */
export interface TodoSchedule {
	scheduledAt: string; // 本地计划日期和时间，不附带时区。
}

/** 待办类型：不重复、每天、每周、每月、每年。 */
export type TodoTypeInt = 10 | 21 | 22 | 23 | 24;

/** 当前待办数据结构。 */
export interface Todo extends TodoSchedule {
	id: string; // 全局唯一标识。
	title: string; // 待办标题。
	body: string; // 可选正文，未填写时为空字符串。
	type_int: TodoTypeInt; // 待办类型枚举值。
}

/** 当前待办库支持的单次待办。 */
export type DateTodo = Todo & { type_int: 10 };

/** 新增或编辑待办时由界面提供的字段。 */
export interface DateTodoInput extends TodoSchedule {
	title: string; // 待办标题。
	body?: string; // 可选正文。
}

/** 创建待办时由界面提供的字段。 */
export type TodoCreateInput = DateTodoInput & { type_int: TodoTypeInt };

/** 校验输入并创建待办。 */
export function createTodo(input: TodoCreateInput): Todo {
	validateSchedule(input);
	return {
		id: crypto.randomUUID(),
		scheduledAt: input.scheduledAt,
		type_int: input.type_int,
		...normalizeBaseFields(input)
	};
}

/** 校验输入并更新单次待办的可编辑字段。 */
export function updateTodo(todo: DateTodo, input: DateTodoInput): DateTodo {
	validateSchedule(input);
	return { ...todo, scheduledAt: input.scheduledAt, ...normalizeBaseFields(input) };
}

/** 将本地日期时间转换为 Date。 */
export function toLocalDate(schedule: TodoSchedule): Date {
	validateSchedule(schedule);
	const [datePart, timePart] = schedule.scheduledAt.split('T');
	const [year, month, day] = datePart.split('-').map(Number);
	const [hour, minute] = timePart.split(':').map(Number);
	return new Date(year, month - 1, day, hour, minute);
}

/** 将 Date 转换为待办使用的本地日期时间。 */
export function toTodoSchedule(date: Date): TodoSchedule {
	if (Number.isNaN(date.getTime())) throw new Error('请选择有效时间');
	return { scheduledAt: `${formatDateKey(date)}T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}` };
}

/** 判断值是否为有效待办。 */
export function isTodo(value: unknown): value is Todo {
	if (typeof value !== 'object' || value === null) return false;
	const todo = value as Record<string, unknown>;
	if (typeof todo.id !== 'string' || typeof todo.title !== 'string' || !todo.title.trim()) return false;
	if (typeof todo.body !== 'string' || typeof todo.scheduledAt !== 'string') return false;
	if (todo.type_int !== 10 && todo.type_int !== 21 && todo.type_int !== 22 && todo.type_int !== 23 && todo.type_int !== 24) {
		return false;
	}

	try {
		validateSchedule({ scheduledAt: todo.scheduledAt });
		return true;
	} catch {
		return false;
	}
}

/** 判断待办是否为当前界面支持的单次类型。 */
export function isDateTodo(todo: Todo): todo is DateTodo {
	return todo.type_int === 10;
}

/** 校验并规范化待办的公共文本字段。 */
function normalizeBaseFields(input: { title: string; body?: string }): Pick<Todo, 'title' | 'body'> {
	const title = input.title.trim();
	if (!title) throw new Error('请输入待办标题');
	return { title, body: input.body?.trim() ?? '' };
}

/** 校验本地日期时间。 */
function validateSchedule(schedule: TodoSchedule): void {
	const match = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/.exec(schedule.scheduledAt);
	if (!match) throw new Error('请选择有效日期和时间');

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		throw new Error('请选择有效日期');
	}
}

/** 将本地 Date 格式化为 YYYY-MM-DD。 */
function formatDateKey(date: Date): string {
	return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

/** 将数字补齐为两位。 */
function padNumber(value: number): string {
	return value.toString().padStart(2, '0');
}
