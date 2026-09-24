<script lang="ts">
	import { Button, Input } from '@knowckx/infa-s5';
	import { ChevronRight } from '@lucide/svelte';
	import { toLocalDate, toTodoSchedule, type TodoCreateInput, type TodoTypeInt } from '@/lib/todos/todo';

	type RepeatType = Exclude<TodoTypeInt, 10>;

	interface Props {
		onCancel: () => void;
		onSubmit: (input: TodoCreateInput) => void;
	}

	const tomorrow = new Date(); // 新建待办默认安排在本地明天。
	tomorrow.setDate(tomorrow.getDate() + 1);
	const repeatOptions: ReadonlyArray<{ id: RepeatType; label: string }> = [
		{ id: 21, label: '每天' },
		{ id: 22, label: '每周' },
		{ id: 23, label: '每月' },
		{ id: 24, label: '每年' }
	]; // Bottom Sheet 中的日历周期选项。
	const repeatLabels: Record<TodoTypeInt, string> = {
		10: '不重复',
		21: '每天',
		22: '每周',
		23: '每月',
		24: '每年'
	}; // 新增表单中的重复方式名称。
	const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; // 星期提示。

	let { onCancel, onSubmit }: Props = $props();
	let title = $state(''); // 待办标题。
	let dateKey = $state(toTodoSchedule(tomorrow).scheduledAt.slice(0, 10)); // 表单日期。
	let time = $state('12:00'); // 本地时间。
	let body = $state(''); // 可选备注。
	let repeat = $state<TodoTypeInt>(10); // 当前选择的待办类型；10 表示不重复。
	let isRepeatSheetOpen = $state(false); // 是否显示重复方式 Bottom Sheet。
	let repeatHint = $derived(getRepeatHint(repeat, dateKey)); // 当前日期对应的周期提示。

	/** 创建指定日期待办。 */
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (repeat !== 10) return;
		onSubmit({ type_int: 10, title, scheduledAt: `${dateKey}T${time}`, body });
	}

	/** 打开重复方式 Bottom Sheet。 */
	function openRepeatSheet() {
		isRepeatSheetOpen = true;
	}

	/** 关闭重复方式 Bottom Sheet。 */
	function closeRepeatSheet() {
		isRepeatSheetOpen = false;
	}

	/** 选择重复方式并返回新增表单。 */
	function selectRepeat(event: MouseEvent) {
		const value = (event.currentTarget as HTMLButtonElement).dataset.repeat;
		repeat = Number(value) as TodoTypeInt;
		isRepeatSheetOpen = false;
	}

	/** 根据表单日期显示周期对应的星期或日期。 */
	function getRepeatHint(value: TodoTypeInt, selectedDateKey: string): string {
		if (value === 10 || !selectedDateKey) return '';
		if (value === 21) return '每天重复';

		const date = toLocalDate({ scheduledAt: `${selectedDateKey}T12:00` });
		if (value === 22) return `每周：${weekdays[date.getDay()]}`;
		if (value === 23) return `每月：${date.getDate()}号`;
		return `每年：${date.getMonth() + 1}月${date.getDate()}号`;
	}

	/** Escape 优先关闭 Bottom Sheet，再关闭新增弹层。 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (isRepeatSheetOpen) {
			closeRepeatSheet();
			return;
		}
		onCancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
	<button
		type="button"
		class="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
		onclick={onCancel}
		aria-label="关闭新增待办"
	></button>

	<div
		class="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
		role="dialog"
		aria-modal="true"
		aria-labelledby="add-todo-title"
	>
		<header class="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
			<h2 id="add-todo-title" class="text-xl font-bold text-slate-900">新增待办</h2>
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
						<Input type="date" bind:value={dateKey} required clearOnEscape={false} />
					</label>
					<label class="block min-w-0">
						<span class="mb-1.5 block text-sm font-medium text-slate-700">时间</span>
						<Input type="time" bind:value={time} required clearOnEscape={false} />
					</label>
				</div>

				<button
					type="button"
					class="flex min-h-12 w-full items-center justify-between border-b border-slate-100 text-sm text-slate-700"
					onclick={openRepeatSheet}
				>
					<span>重复</span>
					<span class="flex items-center gap-1">{repeatLabels[repeat]} <ChevronRight size={18} /></span>
				</button>
				{#if repeatHint}
					<p class="-mt-3 text-xs text-slate-500">{repeatHint}</p>
					<p class="-mt-3 text-xs text-amber-700">周期待办创建暂未开放</p>
				{/if}

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
				<Button type="submit" variant="primary" class="flex-1" disabled={repeat !== 10}>创建</Button>
			</footer>
		</form>
	</div>
</div>

{#if isRepeatSheetOpen}
	<div class="fixed inset-0 z-[60] flex items-end justify-center" role="presentation">
		<button
			type="button"
			class="absolute inset-0 bg-slate-950/35"
			onclick={closeRepeatSheet}
			aria-label="关闭重复设置"
		></button>

		<div
			class="relative w-full max-w-lg rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:mb-6 sm:rounded-3xl sm:px-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="repeat-sheet-title"
		>
			<h2 id="repeat-sheet-title" class="mb-5 text-lg font-semibold text-slate-900">重复</h2>
			<div class="space-y-4">
				<button
					type="button"
					class="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 text-left text-sm font-medium text-slate-700"
					class:border-sky-400={repeat === 10}
					class:bg-sky-50={repeat === 10}
					data-repeat="10"
					onclick={selectRepeat}
					aria-pressed={repeat === 10}
				>
					<span class="grid size-5 place-items-center rounded-full border border-current text-sky-600">{repeat === 10 ? '●' : ''}</span>
					不重复
				</button>

				<div class="grid grid-cols-2 gap-3" role="group" aria-label="日历周期">
					{#each repeatOptions as option (option.id)}
						<button
							type="button"
							class="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 text-left text-sm font-medium text-slate-700"
							class:border-sky-400={repeat === option.id}
							class:bg-sky-50={repeat === option.id}
							data-repeat={option.id}
							onclick={selectRepeat}
							aria-pressed={repeat === option.id}
						>
							<span class="grid size-5 place-items-center rounded-full border border-current text-sky-600">{repeat === option.id ? '●' : ''}</span>
							{option.label}
						</button>
					{/each}
				</div>

				{#if repeatHint}
					<p class="text-sm text-slate-500">{repeatHint}</p>
				{/if}

			</div>
		</div>
	</div>
{/if}
