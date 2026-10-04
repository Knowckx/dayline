<script lang="ts">
	import { Button, Input } from '@knowckx/infa-s5';
	import { toTodoSchedule, type TodoCreateInput, type TodoTypeInt } from '@/lib/todos/todo';

	interface Props {
		onCancel: () => void;
		onSubmit: (input: TodoCreateInput) => void;
	}

	const tomorrow = new Date(); // 新建待办默认安排在本地明天。
	tomorrow.setDate(tomorrow.getDate() + 1);
	const repeatOptions: ReadonlyArray<{ id: TodoTypeInt; label: string }> = [
		{ id: 10, label: '不重复' },
		{ id: 21, label: '每日' },
		{ id: 22, label: '每周' },
		{ id: 23, label: '每月' },
		{ id: 24, label: '每年' }
	]; // 新增待办支持的重复选项。

	let { onCancel, onSubmit }: Props = $props();
	let title = $state(''); // 待办标题。
	let dateKey = $state(toTodoSchedule(tomorrow).scheduledAt.slice(0, 10)); // 表单日期。
	let time = $state('00:00'); // 本地时间，默认所选日期的零点。
	let body = $state(''); // 可选备注。
	let typeInt = $state<TodoTypeInt>(10); // 当前重复类型。
	let additional = $state(''); // 当前附加规则，LAST_DAY 表示每月最后一天。
	let dayOfMonth = $derived(Number(dateKey.slice(8, 10))); // 所选日期的日号。
	let monthOfYear = $derived(Number(dateKey.slice(5, 7))); // 所选日期的月份。
	let weekday = $derived('日一二三四五六'[new Date(`${dateKey}T00:00`).getDay()]); // 所选日期的星期文字。
	let isLastDay = $derived(isMonthLastDay(dateKey)); // 所选日期是否为月末。

	/** 保存用户输入的日期、时间和重复规则。 */
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onSubmit({ type_int: typeInt, additional, title, scheduledAt: `${dateKey}T${time}`, body });
	}

	/** 提供日期输入的当前值。 */
	function getDateKey(): string {
		return dateKey;
	}

	/** 更新日期并按当前重复类型重置附加规则。 */
	function setDateKey(value: string) {
		dateKey = value;
		resetAdditional();
	}

	/** 选择重复类型并重新推导附加规则。 */
	function selectRepeat(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		typeInt = Number(button.dataset.repeatType) as TodoTypeInt;
		resetAdditional();
	}

	/** 清空旧规则，每月且日期为月末时默认使用月末模式。 */
	function resetAdditional() {
		additional = '';
		if (typeInt === 23 && isMonthLastDay(dateKey)) additional = 'LAST_DAY';
	}

	/** 在固定日号与月末模式之间切换。 */
	function toggleMonthlyMode() {
		additional = additional === 'LAST_DAY' ? '' : 'LAST_DAY';
	}

	/** 判断日期是否为其所在月份的最后一天。 */
	function isMonthLastDay(value: string): boolean {
		const [year, month, day] = value.split('-').map(Number);
		return day === new Date(year, month, 0).getDate();
	}

	/** Escape 取消创建并返回待办库。 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onCancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="flex h-full min-h-0 flex-col bg-white text-slate-900" aria-labelledby="add-todo-title">
	<header class="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
		<h1 id="add-todo-title" class="text-xl font-bold">新增待办</h1>
	</header>

		<form class="flex min-h-0 flex-1 flex-col" onsubmit={handleSubmit}>
			<div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
				<label class="block">
					<span class="mb-1.5 block text-sm font-medium text-slate-700">标题</span>
					<Input
						bind:value={title}
						placeholder="例如：理发"
						maxlength={100}
						required
						autoFocus
						clearOnEscape={false}
					/>
				</label>

				<div class="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
					<label class="block min-w-0">
						<span class="mb-1.5 block text-sm font-medium text-slate-700">日期</span>
						<Input type="date" bind:value={getDateKey, setDateKey} required clearOnEscape={false} />
					</label>
					<label class="block min-w-0">
						<span class="mb-1.5 block text-sm font-medium text-slate-700">时间</span>
						<Input type="time" bind:value={time} required clearOnEscape={false} />
					</label>
				</div>

				<fieldset class="space-y-3">
					<legend class="text-sm font-medium text-slate-700">重复</legend>
					<div class="grid grid-cols-2 gap-3">
						{#each repeatOptions as option (option.id)}
							<button
								type="button"
								class="min-h-12 rounded-xl border px-4 text-left text-sm {typeInt === option.id ? 'border-sky-400 bg-sky-50 font-medium text-sky-700' : 'border-slate-200 text-slate-700'}"
								class:col-span-2={option.id === 10}
								data-repeat-type={option.id}
								aria-pressed={typeInt === option.id}
								onclick={selectRepeat}
							>
								{option.label}
							</button>
						{/each}
					</div>
					{#if typeInt === 22 && dateKey}
						<p class="text-sm text-slate-500" aria-live="polite">已设为：每星期{weekday}</p>
					{:else if typeInt === 24 && dateKey}
						<p class="text-sm text-slate-500" aria-live="polite">已设为：每年{monthOfYear}月{dayOfMonth}日</p>
					{:else if typeInt === 23 && dateKey}
						<p class="text-sm text-slate-500" aria-live="polite">
							已设为：{additional === 'LAST_DAY' ? '每月最后一天' : `每月${dayOfMonth}日`}　下次：(...)
						</p>
						{#if isLastDay}
							<button type="button" class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700" onclick={toggleMonthlyMode}>
								{additional === 'LAST_DAY' ? `改为每月${dayOfMonth}日` : '改为每月最后一天'}
							</button>
						{/if}
					{/if}
				</fieldset>

				<label class="block">
					<span class="mb-1.5 block text-sm font-medium text-slate-700">
						备注 <span class="font-normal text-slate-400">（可选）</span>
					</span>
					<textarea
						bind:value={body}
						rows="3"
						maxlength="2000"
						placeholder="添加备注"
						class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
					></textarea>
				</label>
			</div>

			<footer class="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
				<Button type="button" class="flex-1" onclick={onCancel}>取消</Button>
				<Button type="submit" variant="primary" class="flex-1" disabled={!title.trim()}>创建</Button>
			</footer>
		</form>
</main>
