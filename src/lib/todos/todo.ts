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
	remind_offset_minutes: number; // 提前提醒分钟数；-1 不提醒，0 到点提醒。
	additional: string; // 附加标记；空字符串表示无标记，每月最后一天使用 LAST_DAY。
}

/** 不重复的单次待办。 */
export type DateTodo = Todo & { type_int: 10 };

/** 新增或编辑待办时由界面提供的字段。 */
export interface DateTodoInput extends TodoSchedule {
	title: string; // 待办标题。
	body?: string; // 可选正文。
}

/** 创建待办时由界面提供的字段。 */
export interface TodoCreateInput extends DateTodoInput {
	type_int: TodoTypeInt; // 所选重复类型。
	additional: string; // 所选附加规则；每月最后一天使用 LAST_DAY。
}

/** 推算发生时间所需的重复规则。 */
export type TodoRepeatRule = Pick<Todo, 'type_int' | 'additional'>;

/** 返回本地下一次发生时间（包含恰好到点）；单次待办返回原时间，now 默认为当前时间。 */
export function getNextOccurrence(scheduledAt: string, rule: TodoRepeatRule, now: Date = new Date()): Date {
	const selected = toLocalDate({ scheduledAt }); // 用户选择的日期时间，用于提取重复规则。
	const hour = selected.getHours(); // 每次发生的本地小时。
	const minute = selected.getMinutes(); // 每次发生的本地分钟。
	const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute); // 当前日期的候选时间。

	switch (rule.type_int) {
		case 10:
			return selected;
		case 21:
			if (candidate < now) candidate.setDate(candidate.getDate() + 1);
			return candidate;
		case 22:
			candidate.setDate(candidate.getDate() + (selected.getDay() - candidate.getDay() + 7) % 7);
			if (candidate < now) candidate.setDate(candidate.getDate() + 7);
			return candidate;
		case 23:
			for (let offset = 0; ; offset += 1) {
				const month = now.getMonth() + offset; // 从当前月份向后查找。
				const lastDay = new Date(now.getFullYear(), month + 1, 0).getDate(); // 候选月份的最后一天。
				const day = rule.additional === 'LAST_DAY' ? lastDay : selected.getDate(); // 月末或固定日号。
				if (day > lastDay) continue;
				const occurrence = new Date(now.getFullYear(), month, day, hour, minute); // 有效月份的候选发生时间。
				if (occurrence >= now) return occurrence;
			}
		case 24:
			for (let year = now.getFullYear(); ; year += 1) {
				const occurrence = new Date(year, selected.getMonth(), selected.getDate(), hour, minute); // 候选年份的发生时间。
				if (occurrence.getMonth() !== selected.getMonth()) continue;
				if (occurrence >= now) return occurrence;
			}
	}
}

/** 校验输入并创建待办。 */
export function createTodo(input: TodoCreateInput): Todo {
	validateSchedule(input);
	return {
		id: crypto.randomUUID(),
		scheduledAt: input.scheduledAt,
		type_int: input.type_int,
		remind_offset_minutes: 0,
		additional: input.additional,
		...normalizeBaseFields(input)
	};
}

/** 更新表单字段及重复规则，保留 ID 和提醒偏移。 */
export function updateTodo(todo: Todo, input: TodoCreateInput): Todo {
	validateSchedule(input);
	return {
		...todo, scheduledAt: input.scheduledAt, type_int: input.type_int,
		additional: input.additional, ...normalizeBaseFields(input)
	};
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
	if (typeof todo.remind_offset_minutes !== 'number' || !Number.isInteger(todo.remind_offset_minutes) || todo.remind_offset_minutes < -1) return false;
	if (typeof todo.additional !== 'string') return false;
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

/** 判断待办是否为单次类型。 */
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
