<script lang="ts">
	import { untrack } from 'svelte';
	import { DatePicker, Input } from '@knowckx/infa-s5';
	import { formatTodoRepeat, getNextOccurrence, normalizeScheduledDates, toTodoSchedule, type TodoCreateInput, type TodoTypeInt } from '@/lib/todos/todo';

	interface Props {
		input: TodoCreateInput; // 两页共享的表单草稿，保存前不修改原待办。
		autoFocus?: boolean; // 新增时自动聚焦标题，详情默认先浏览。
	}

	let { input = $bindable(), autoFocus = false }: Props = $props();
	let selectedDates = $state(untrack(getInitialDates)); // 当前选择的日期，无日期规则仅在表单草稿中保留。
	let time = $derived(input.scheduledTime); // 表单共用本地时间。
	const repeatOptions: ReadonlyArray<{ id: TodoTypeInt; label: string }> = [
		{ id: 10, label: '不重复' },
		{ id: 21, label: '每日' },
		{ id: 22, label: '每周' },
		{ id: 23, label: '每月' },
		{ id: 24, label: '每年' }
	]; // 共用表单支持的重复选项。

	let dayOfMonth = $derived(Number(selectedDates[0].slice(8, 10))); // 单日期月末切换使用的日号。
	let isLastDay = $derived(selectedDates.length === 1 && isMonthLastDay(selectedDates[0])); // 是否仅选择了一个月末日期。
	let repeatLabel = $derived(formatTodoRepeat(input)); // 表单与列表共用的重复规则标记。
	let dateLabel = $derived(input.type_int === 10 ? selectedDates[0] : repeatLabel); // 日期入口的选择摘要。
	let nextTime = $derived(input.type_int === 23 && time ? formatNextTime() : ''); // 每月规则的下一次发生时间。
	let skipsMissingDays = $derived(input.type_int === 23 && input.additional !== 'LAST_DAY' && hasLateMonthDays()); // 是否需要说明缺失日号跳过。

	/** 无日期规则打开详情时，使用今天或本月末作为日期控件的初始值。 */
	function getInitialDates(): string[] {
		if (input.scheduledDate.length) return [...input.scheduledDate];
		const date = new Date();
		if (input.type_int === 23 && input.additional === 'LAST_DAY') date.setMonth(date.getMonth() + 1, 0);
		return toTodoSchedule(date).scheduledDate;
	}

	/** 格式化每月规则的下一次本地发生时间。 */
	function formatNextTime(): string {
		const schedule = toTodoSchedule(getNextOccurrence(input));
		return `${schedule.scheduledDate[0]} ${schedule.scheduledTime}`;
	}

	/** 确认日历草稿后，按当前重复条件去重并更新表单。 */
	function saveDates(dates: string[]) {
		selectedDates = normalizeScheduledDates(dates, input.type_int);
		resetAdditional();
	}

	/** 选择重复类型并重新推导附加规则。 */
	function selectRepeat(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		input.type_int = Number(button.dataset.repeatType) as TodoTypeInt;
		if (input.type_int !== 21) selectedDates = normalizeScheduledDates(selectedDates, input.type_int);
		resetAdditional();
	}

	/** 清空旧规则，每月仅选择一个月末日期时默认使用月末模式。 */
	function resetAdditional() {
		input.additional = '';
		if (input.type_int === 23 && selectedDates.length === 1 && isMonthLastDay(selectedDates[0])) input.additional = 'LAST_DAY';
		syncScheduledDate();
	}

	/** 在固定日号与月末模式之间切换。 */
	function toggleMonthlyMode() {
		input.additional = input.additional === 'LAST_DAY' ? '' : 'LAST_DAY';
		syncScheduledDate();
	}

	/** 每日和月末保存空日期数组，其他规则保存已确认的完整日期。 */
	function syncScheduledDate() {
		input.scheduledDate = input.type_int === 21 || input.type_int === 23 && input.additional === 'LAST_DAY'
			? [] : [...selectedDates];
	}

	/** 判断日期是否为其所在月份的最后一天。 */
	function isMonthLastDay(value: string): boolean {
		const [year, month, day] = value.split('-').map(Number);
		return day === new Date(year, month, 0).getDate();
	}

	/** 判断固定日号是否包含可能在某些月份缺失的日期。 */
	function hasLateMonthDays(): boolean {
		for (const dateKey of selectedDates) {
			if (Number(dateKey.slice(8, 10)) >= 29) return true;
		}
		return false;
	}


	/** 提供时间输入的当前值。 */
	function getTime(): string {
		return time;
	}

	/** 修改时间时保留重复附加规则。 */
	function setTime(value: string) {
		input.scheduledTime = value;
	}
</script>

	<div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
		<label class="block">
			<span class="mb-1.5 block text-sm font-medium text-slate-700">标题</span>
			<Input
				bind:value={input.title}
				placeholder="例如：理发"
				maxlength={100}
				required
				{autoFocus}
				clearOnEscape={false}
			/>
		</label>

		<div class="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
			<div class="min-w-0">
				<p class="mb-1.5 text-sm font-medium text-slate-700">日期</p>
				{#if input.type_int === 21}
					<p class="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">每天</p>
				{:else}
					<DatePicker value={selectedDates} label={dateLabel} multiple={input.type_int !== 10} onSave={saveDates} />
				{/if}
			</div>
			<label class="block min-w-0">
				<span class="mb-1.5 block text-sm font-medium text-slate-700">时间</span>
				<Input type="time" bind:value={getTime, setTime} required clearOnEscape={false} />
			</label>
		</div>

		<fieldset class="space-y-3">
			<legend class="text-sm font-medium text-slate-700">重复</legend>
			<div class="grid grid-cols-2 gap-3">
				{#each repeatOptions as option (option.id)}
					<button
						type="button"
						class="min-h-12 rounded-xl border px-4 text-left text-sm {input.type_int === option.id ? 'border-sky-400 bg-sky-50 font-medium text-sky-700' : 'border-slate-200 text-slate-700'}"
						class:col-span-2={option.id === 10}
						data-repeat-type={option.id}
						aria-pressed={input.type_int === option.id}
						onclick={selectRepeat}
					>
						{option.label}
					</button>
				{/each}
			</div>
			{#if input.type_int === 22 || input.type_int === 24}
				<p class="text-sm text-slate-500" aria-live="polite">已设为：{repeatLabel}</p>
			{:else if input.type_int === 23}
				<p class="text-sm text-slate-500" aria-live="polite">
					已设为：{repeatLabel}　下次：{nextTime}
				</p>
				{#if skipsMissingDays}
					<p class="text-sm text-slate-500">当月没有所选日期时跳过</p>
				{/if}
				{#if isLastDay}
					<button type="button" class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700" onclick={toggleMonthlyMode}>
						{input.additional === 'LAST_DAY' ? `改为每月${dayOfMonth}日` : '改为每月最后一天'}
					</button>
				{/if}
			{/if}
		</fieldset>

		<label class="block">
			<span class="mb-1.5 block text-sm font-medium text-slate-700">
				备注 <span class="font-normal text-slate-400">（可选）</span>
			</span>
			<textarea
				bind:value={input.body}
				rows="3"
				maxlength="2000"
				placeholder="添加备注"
				class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
			></textarea>
		</label>
	</div>
