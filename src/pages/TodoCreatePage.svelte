<script lang="ts">
	import { Button, Input } from '@knowckx/infa-s5';
	import { toTodoSchedule, type TodoCreateInput, type TodoTypeInt } from '@/lib/todos/todo';

	interface Props {
		onCancel: () => void;
		onSubmit: (input: TodoCreateInput) => void;
	}

	const tomorrow = new Date(); // 新建待办默认安排在本地明天。
	tomorrow.setDate(tomorrow.getDate() + 1);
	const repeatOptions: ReadonlyArray<{ id: Exclude<TodoTypeInt, 10>; label: string }> = [
		{ id: 21, label: '每天' },
		{ id: 22, label: '每周' },
		{ id: 23, label: '每月' },
		{ id: 24, label: '每年' }
	]; // 尚未开放的日历周期选项。

	let { onCancel, onSubmit }: Props = $props();
	let title = $state(''); // 待办标题。
	let dateKey = $state(toTodoSchedule(tomorrow).scheduledAt.slice(0, 10)); // 表单日期。
	let time = $state('12:00'); // 本地时间。
	let body = $state(''); // 可选备注。

	/** 创建指定日期待办。 */
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onSubmit({ type_int: 10, title, scheduledAt: `${dateKey}T${time}`, body });
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
						<Input type="date" bind:value={dateKey} required clearOnEscape={false} />
					</label>
					<label class="block min-w-0">
						<span class="mb-1.5 block text-sm font-medium text-slate-700">时间</span>
						<Input type="time" bind:value={time} required clearOnEscape={false} />
					</label>
				</div>

				<fieldset class="space-y-3">
					<legend class="text-sm font-medium text-slate-700">重复</legend>
					<div class="grid grid-cols-2 gap-3">
						<div class="flex min-h-12 items-center rounded-xl border border-sky-400 bg-sky-50 px-4 text-sm font-medium text-sky-700">
							不重复
						</div>
						{#each repeatOptions as option (option.id)}
							<button type="button" class="min-h-12 rounded-xl border border-slate-200 px-4 text-left text-sm text-slate-400" disabled>
								{option.label}
							</button>
						{/each}
					</div>
					<p class="text-xs text-slate-500">周期待办暂未开放</p>
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
				<Button type="submit" variant="primary" class="flex-1">创建</Button>
			</footer>
		</form>
</main>
