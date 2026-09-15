<script lang="ts">
	import { buildMonthCells, formatDateKey } from '@/lib/calendar/month_calendar';

	const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']; // 周一开始的星期标题。
	const initialToday = new Date(); // 组件打开时的本地日期。
	const todayKey = formatDateKey(
		initialToday.getFullYear(),
		initialToday.getMonth() + 1,
		initialToday.getDate()
	); // 用于今天高亮的稳定日期键。

	let viewYear = $state(initialToday.getFullYear()); // 当前展示年份。
	let viewMonth = $state(initialToday.getMonth() + 1); // 当前展示月份。
	let monthTitle = $derived(`${viewYear}年${viewMonth}月`); // 月历标题。
	let cells = $derived(buildMonthCells(viewYear, viewMonth, todayKey)); // 当前日期格。

	/** 显示上一个月。 */
	function showPreviousMonth() {
		shiftMonth(-1);
	}

	/** 显示下一个月。 */
	function showNextMonth() {
		shiftMonth(1);
	}

	/** 回到今天所在月份。 */
	function showCurrentMonth() {
		viewYear = initialToday.getFullYear();
		viewMonth = initialToday.getMonth() + 1;
	}

	/** 将当前展示月份前后移动指定月数。 */
	function shiftMonth(offset: number) {
		const target = new Date(viewYear, viewMonth - 1 + offset, 1);
		viewYear = target.getFullYear();
		viewMonth = target.getMonth() + 1;
	}
</script>

<section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label={monthTitle}>
	<header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
		<button
			type="button"
			class="grid size-10 place-items-center rounded-full text-2xl text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
			onclick={showPreviousMonth}
			aria-label="上一个月"
		>
			<span aria-hidden="true">‹</span>
		</button>

		<div class="text-center">
			<h2 class="text-lg font-semibold tracking-tight text-slate-900">{monthTitle}</h2>
			<button
				type="button"
				class="mt-0.5 text-xs font-medium text-sky-600 hover:text-sky-700"
				onclick={showCurrentMonth}
			>
				回到今天
			</button>
		</div>

		<button
			type="button"
			class="grid size-10 place-items-center rounded-full text-2xl text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
			onclick={showNextMonth}
			aria-label="下一个月"
		>
			<span aria-hidden="true">›</span>
		</button>
	</header>

	<div class="grid grid-cols-7 border-b border-slate-100 px-2 py-2 sm:px-4">
		{#each WEEKDAYS as weekday, index}
			<div
				class:text-rose-500={index >= 5}
				class="py-1 text-center text-xs font-medium text-slate-400"
			>
				{weekday}
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-7 px-2 pb-3 pt-1 sm:px-4 sm:pb-5" role="grid" aria-label={monthTitle}>
		{#each cells as cell, index (cell.dateKey)}
			<div
				role="gridcell"
				aria-current={cell.isToday ? 'date' : undefined}
				class:opacity-35={!cell.isCurrentMonth}
				class="flex min-h-16 flex-col items-center justify-start rounded-xl py-2 sm:min-h-20"
			>
				<time
					datetime={cell.dateKey}
					class:bg-sky-600={cell.isToday}
					class:text-white={cell.isToday}
					class:text-rose-500={!cell.isToday && index % 7 >= 5}
					class="grid size-8 place-items-center rounded-full text-sm font-semibold text-slate-800"
				>
					{cell.day}
				</time>
				<span
					class:text-sky-600={cell.isToday}
					class="mt-1 max-w-full truncate px-0.5 text-[10px] leading-4 text-slate-400 sm:text-xs"
				>
					{cell.lunarLabel}
				</span>
			</div>
		{/each}
	</div>
</section>
