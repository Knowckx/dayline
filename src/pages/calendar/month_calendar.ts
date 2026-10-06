import { SolarDay } from 'tyme4ts';

const CELL_COUNT = 42; // 固定六周，避免翻月时布局高度跳动。
const MONDAY_INDEX_OFFSET = 6; // 将 JavaScript 的周日首位换算为周一首位。

/** 月历中的单个公历日期及其农历显示信息。 */
export interface CalendarCell {
	dateKey: string; // 本地日期键，供后续待办按日关联。
	year: number; // 公历年份。
	month: number; // 公历月份，范围 1 到 12。
	day: number; // 公历日期。
	lunarLabel: string; // 日期格中的农历短标签。
	isCurrentMonth: boolean; // 是否属于当前展示月份。
	isToday: boolean; // 是否为今天。
}

/** 生成周一开始、固定六周的月历日期格。 */
export function buildMonthCells(year: number, month: number, todayKey: string): CalendarCell[] {
	const firstDay = new Date(year, month - 1, 1);
	const leadingDayCount = (firstDay.getDay() + MONDAY_INDEX_OFFSET) % 7;
	const cells: CalendarCell[] = [];

	for (let index = 0; index < CELL_COUNT; index += 1) {
		const date = new Date(year, month - 1, index - leadingDayCount + 1);
		const cellYear = date.getFullYear();
		const cellMonth = date.getMonth() + 1;
		const cellDay = date.getDate();
		const dateKey = formatDateKey(cellYear, cellMonth, cellDay);

		cells.push({
			dateKey,
			year: cellYear,
			month: cellMonth,
			day: cellDay,
			lunarLabel: getLunarLabel(cellYear, cellMonth, cellDay),
			isCurrentMonth: cellYear === year && cellMonth === month,
			isToday: dateKey === todayKey
		});
	}

	return cells;
}

/** 将本地日期转换为稳定的 YYYY-MM-DD 日期键。 */
export function formatDateKey(year: number, month: number, day: number): string {
	return `${year}-${padNumber(month)}-${padNumber(day)}`;
}

/** 生成适合日期格显示的农历月份或日期名称。 */
function getLunarLabel(year: number, month: number, day: number): string {
	const lunarDay = SolarDay.fromYmd(year, month, day).getLunarDay();
	return lunarDay.getDay() === 1 ? lunarDay.getLunarMonth().getName() : lunarDay.getName();
}

/** 将数字补齐为两位。 */
function padNumber(value: number): string {
	return value.toString().padStart(2, '0');
}
