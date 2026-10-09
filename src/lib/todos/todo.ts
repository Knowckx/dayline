/** 待办使用的本地日期数组和共用时间。 */
export interface TodoSchedule {
	scheduledDate: string[]; // 本地日期数组，格式为 YYYY-MM-DD，不附带时区。
	scheduledTime: string; // 全部日期共用的本地时间，格式为 HH:mm。
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

/** 推算发生时间所需的日期、时间和重复规则。 */
export type TodoRepeatRule = Pick<Todo, 'scheduledDate' | 'scheduledTime' | 'type_int' | 'additional'>;

/** 返回全部重复日期中最近的本地发生时间（包含恰好到点），单次待办保留原时间。 */
export function getNextOccurrence(rule: TodoRepeatRule, now: Date = new Date()): Date {
	validateTodoSchedule(rule);
	const [hour, minute] = rule.scheduledTime.split(':').map(Number); // 每次发生的共用本地时间。
	const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute); // 当前日期的候选时间。
	if (rule.type_int === 10) return toLocalDate(rule);
	if (rule.type_int === 21) {
		if (candidate < now) candidate.setDate(candidate.getDate() + 1);
		return candidate;
	}
	if (rule.type_int === 23 && rule.additional === 'LAST_DAY') {
		for (let offset = 0; ; offset += 1) {
			const occurrence = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, hour, minute);
			if (occurrence >= now) return occurrence;
		}
	}

	let next: Date | undefined; // 所有重复条件中最近的一次发生。
	for (const dateKey of rule.scheduledDate) {
		const [year, month, day] = dateKey.split('-').map(Number);
		const selected = new Date(year, month - 1, day, hour, minute); // 该日期提供的重复条件。
		const occurrence = getNextRepeatedDate(selected, rule.type_int, now);
		if (!next || occurrence < next) next = occurrence;
	}
	return next!;
}

/** 按星期、日号或月日去重，保留完整日期并升序排列；每日返回空数组，单次保留一项。 */
export function normalizeScheduledDates(dates: string[], type: TodoTypeInt): string[] {
	if (type === 21) return [];
	const sorted = [...dates].sort(); // 日期格式统一，可直接按字符串排序。
	if (type === 10) return sorted.slice(0, 1);
	const keys = new Set<string>(); // 已保留的重复条件。
	const normalized: string[] = []; // 每个重复条件保留一个原始日期。
	for (const dateKey of sorted) {
		const key = getRepeatDateKey(dateKey, type);
		if (keys.has(key)) continue;
		keys.add(key);
		normalized.push(dateKey);
	}
	return normalized;
}

/** 生成周期标记，供表单提示和列表共用；单次返回空字符串。 */
export function formatTodoRepeat(rule: TodoRepeatRule): string {
	if (rule.type_int === 10) return '';
	if (rule.type_int === 21) return '每天';
	if (rule.type_int === 23 && rule.additional === 'LAST_DAY') return '每月最后一天';
	const keys = new Set<string>();
	for (const dateKey of rule.scheduledDate) keys.add(getRepeatDateKey(dateKey, rule.type_int));
	const values = [...keys].sort();
	if (rule.type_int === 22) {
		values.sort(compareWeekdays);
		const weekdays: string[] = [];
		for (const value of values) weekdays.push('日一二三四五六'[Number(value)]);
		return `每周${weekdays.join('、')}`;
	}
	if (rule.type_int === 23) {
		const days: number[] = [];
		for (const value of values) days.push(Number(value));
		return `每月 ${days.join('、')} 日`;
	}
	const monthDays: string[] = [];
	for (const value of values) {
		const [month, day] = value.split('-').map(Number);
		monthDays.push(`${month} 月 ${day} 日`);
	}
	return `每年 ${monthDays.join('、')}`;
}

/** 校验输入并创建待办。 */
export function createTodo(input: TodoCreateInput): Todo {
	validateTodoSchedule(input);
	return {
		id: crypto.randomUUID(),
		scheduledDate: normalizeScheduledDates(input.scheduledDate, input.type_int),
		scheduledTime: input.scheduledTime,
		type_int: input.type_int,
		remind_offset_minutes: 0,
		additional: input.additional,
		...normalizeBaseFields(input)
	};
}

/** 更新表单字段及重复规则，保留 ID 和提醒偏移。 */
export function updateTodo(todo: Todo, input: TodoCreateInput): Todo {
	validateTodoSchedule(input);
	return {
		...todo, scheduledDate: normalizeScheduledDates(input.scheduledDate, input.type_int), scheduledTime: input.scheduledTime,
		type_int: input.type_int, additional: input.additional, ...normalizeBaseFields(input)
	};
}

/** 将首个本地日期与共用时间转换为 Date，要求日期数组非空。 */
export function toLocalDate(schedule: TodoSchedule): Date {
	validateSchedule(schedule);
	const datePart = schedule.scheduledDate[0];
	if (!datePart) throw new Error('请选择日期');
	const [year, month, day] = datePart.split('-').map(Number);
	const [hour, minute] = schedule.scheduledTime.split(':').map(Number);
	return new Date(year, month - 1, day, hour, minute);
}

/** 将 Date 拆分为单项本地日期数组和时间。 */
export function toTodoSchedule(date: Date): TodoSchedule {
	if (Number.isNaN(date.getTime())) throw new Error('请选择有效时间');
	return {
		scheduledDate: [formatDateKey(date)],
		scheduledTime: `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
	};
}

/** 判断值是否为有效待办。 */
export function isTodo(value: unknown): value is Todo {
	if (typeof value !== 'object' || value === null) return false;
	const todo = value as Record<string, unknown>;
	if (typeof todo.id !== 'string' || typeof todo.title !== 'string' || !todo.title.trim()) return false;
	if (typeof todo.body !== 'string' || !Array.isArray(todo.scheduledDate) || typeof todo.scheduledTime !== 'string') return false;
	if (typeof todo.remind_offset_minutes !== 'number' || !Number.isInteger(todo.remind_offset_minutes) || todo.remind_offset_minutes < -1) return false;
	if (typeof todo.additional !== 'string') return false;
	if (todo.type_int !== 10 && todo.type_int !== 21 && todo.type_int !== 22 && todo.type_int !== 23 && todo.type_int !== 24) {
		return false;
	}

	try {
		validateTodoSchedule({
			scheduledDate: todo.scheduledDate, scheduledTime: todo.scheduledTime,
			type_int: todo.type_int, additional: todo.additional
		});
		return true;
	} catch {
		return false;
	}
}

/** 判断待办是否为单次类型。 */
export function isDateTodo(todo: Todo): todo is DateTodo {
	return todo.type_int === 10;
}

/** 推算一个日期提供的周、月或年规则；不存在的日期直接跳过。 */
function getNextRepeatedDate(selected: Date, type: 22 | 23 | 24, now: Date): Date {
	const hour = selected.getHours();
	const minute = selected.getMinutes();
	if (type === 22) {
		const occurrence = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
		occurrence.setDate(occurrence.getDate() + (selected.getDay() - occurrence.getDay() + 7) % 7);
		if (occurrence < now) occurrence.setDate(occurrence.getDate() + 7);
		return occurrence;
	}
	if (type === 23) {
		for (let offset = 0; ; offset += 1) {
			const month = now.getMonth() + offset;
			const lastDay = new Date(now.getFullYear(), month + 1, 0).getDate();
			if (selected.getDate() > lastDay) continue;
			const occurrence = new Date(now.getFullYear(), month, selected.getDate(), hour, minute);
			if (occurrence >= now) return occurrence;
		}
	}
	for (let year = now.getFullYear(); ; year += 1) {
		const occurrence = new Date(year, selected.getMonth(), selected.getDate(), hour, minute);
		if (occurrence.getMonth() !== selected.getMonth()) continue;
		if (occurrence >= now) return occurrence;
	}
}

/** 从完整日期提取对应重复条件。 */
function getRepeatDateKey(dateKey: string, type: TodoTypeInt): string {
	if (type === 22) return String(new Date(`${dateKey}T00:00`).getDay());
	if (type === 23) return dateKey.slice(8, 10);
	if (type === 24) return dateKey.slice(5, 10);
	return dateKey;
}

/** 星期按周一至周日排序。 */
function compareWeekdays(left: string, right: string): number {
	return (Number(left) + 6) % 7 - (Number(right) + 6) % 7;
}

/** 校验并规范化待办的公共文本字段。 */
function normalizeBaseFields(input: { title: string; body?: string }): Pick<Todo, 'title' | 'body'> {
	const title = input.title.trim();
	if (!title) throw new Error('请输入待办标题');
	return { title, body: input.body?.trim() ?? '' };
}

/** 校验日期数量与重复规则；每日和月末仅保存时间。 */
function validateTodoSchedule(rule: TodoRepeatRule): void {
	validateSchedule(rule);
	if (rule.type_int === 21 || rule.type_int === 23 && rule.additional === 'LAST_DAY') {
		if (rule.scheduledDate.length) throw new Error('每日和月末规则的日期数组必须为空');
		return;
	}
	if (!rule.scheduledDate.length) throw new Error('请至少选择一个日期');
	if (rule.type_int === 10 && rule.scheduledDate.length !== 1) throw new Error('单次待办只能选择一个日期');
}

/** 校验本地日期数组与共用时间，日期数组允许为空。 */
function validateSchedule(schedule: TodoSchedule): void {
	if (!Array.isArray(schedule.scheduledDate)) throw new Error('日期必须为数组');
	if (typeof schedule.scheduledTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.scheduledTime)) {
		throw new Error('请选择有效时间');
	}
	for (const dateKey of schedule.scheduledDate) {
		if (typeof dateKey !== 'string') throw new Error('请选择有效日期');
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
		if (!match) throw new Error('请选择有效日期');
		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);
		const date = new Date(year, month - 1, day);
		if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
			throw new Error('请选择有效日期');
		}
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
