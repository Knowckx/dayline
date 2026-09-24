<script lang="ts">
	import { AlignLeft, CalendarClock, Pencil, Trash2, Type, X } from '@lucide/svelte';
	import { Button, Input } from '@knowckx/infa-s5';
	import { toLocalDate, type DateTodo, type DateTodoInput } from '@/lib/todos/todo';

	type EditableField = 'title' | 'schedule' | 'body';

	interface Props {
		todo: DateTodo; // 当前查看的指定日期待办。
		onClose: () => void; // 关闭详情弹层。
		onSave: (input: DateTodoInput) => boolean; // 保存单字段编辑，返回是否成功。
		onDelete: () => void; // 确认永久删除。
	}

	let { todo, onClose, onSave, onDelete }: Props = $props();
	let editingField = $state<EditableField | null>(null); // 当前编辑的字段。
	let isDeleteConfirmOpen = $state(false); // 是否显示删除确认。
	let draftTitle = $state(''); // 标题草稿。
	let draftDateTime = $state(''); // 本地计划日期时间草稿。
	let draftBody = $state(''); // 正文草稿。

	/** 打开指定字段并载入当前值。 */
	function startEditing(event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		editingField = button.dataset.field as EditableField;
		draftTitle = todo.title;
		draftDateTime = todo.scheduledAt;
		draftBody = todo.body;
	}

	/** 保存当前字段，其他字段保持原值。 */
	function saveEditing(event: SubmitEvent) {
		event.preventDefault();
		const input: DateTodoInput = {
			title: editingField === 'title' ? draftTitle : todo.title,
			scheduledAt: editingField === 'schedule' ? draftDateTime : todo.scheduledAt,
			body: editingField === 'body' ? draftBody : todo.body
		};

		if (onSave(input)) editingField = null;
	}

	/** 取消当前字段编辑。 */
	function cancelEditing() {
		editingField = null;
	}

	/** 根据当前状态取消操作或关闭弹层。 */
	function dismiss() {
		if (isDeleteConfirmOpen) {
			isDeleteConfirmOpen = false;
			return;
		}
		if (editingField) {
			cancelEditing();
			return;
		}
		onClose();
	}

	/** 支持 Escape 取消当前操作。 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') dismiss();
	}

	/** 显示删除二次确认。 */
	function showDeleteConfirm() {
		isDeleteConfirmOpen = true;
	}

	/** 关闭删除二次确认。 */
	function hideDeleteConfirm() {
		isDeleteConfirmOpen = false;
	}

	/** 格式化完整计划时间。 */
	function formatSchedule(todo: DateTodo): string {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'short'
		};
		options.hour = '2-digit';
		options.minute = '2-digit';
		options.hour12 = false;
		return new Intl.DateTimeFormat('zh-CN', options).format(toLocalDate(todo));
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
	<button
		type="button"
		class="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
		onclick={dismiss}
		aria-label={editingField || isDeleteConfirmOpen ? '取消当前操作' : '关闭待办详情'}
	></button>

	{#if isDeleteConfirmOpen}
		<div
			class="relative mx-5 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="delete-todo-title"
			aria-describedby="delete-todo-description"
		>
			<div class="grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600">
				<Trash2 size={22} />
			</div>
			<h2 id="delete-todo-title" class="mt-4 text-lg font-bold text-slate-900">删除这条待办？</h2>
			<p id="delete-todo-description" class="mt-2 text-sm leading-6 text-slate-500">
				“{todo.title}”将从本地永久删除，此操作无法撤销。
			</p>
			<div class="mt-6 flex gap-3">
				<Button class="flex-1" onclick={hideDeleteConfirm}>取消</Button>
				<Button class="flex-1" variant="danger" onclick={onDelete}>确认删除</Button>
			</div>
		</div>
	{:else}
		<div
			class="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="todo-dialog-title"
		>
			<div class="mx-auto mb-1 h-1 w-10 rounded-full bg-slate-200 sm:hidden"></div>
			<header class="grid min-h-12 grid-cols-[2.75rem_1fr_2.75rem] items-center">
				<button type="button" class="grid size-11 place-items-center rounded-full text-slate-500 hover:bg-slate-100" onclick={dismiss} aria-label={editingField ? '取消编辑' : '关闭'}>
					<X size={20} />
				</button>
				<h2 id="todo-dialog-title" class="text-center text-base font-bold text-slate-900">待办详情</h2>
			</header>

			<div class="pt-3">
				<div class="divide-y divide-slate-100 border-y border-slate-100">
					<section>
						{#if editingField === 'title'}
							<form class="py-4 pl-8" onsubmit={saveEditing}>
								<label class="block">
									<span class="mb-1.5 block text-xs text-slate-400">编辑标题</span>
									<Input bind:value={draftTitle} maxlength={100} required autoFocus clearOnEscape={false} onEscape={cancelEditing} />
								</label>
								<div class="mt-3 flex justify-end gap-2">
									<Button onclick={cancelEditing}>取消</Button>
									<Button type="submit" variant="primary">保存</Button>
								</div>
							</form>
						{:else}
							<button type="button" class="flex w-full gap-3 py-4 text-left disabled:cursor-not-allowed disabled:opacity-50" data-field="title" onclick={startEditing} disabled={editingField !== null} aria-label="编辑标题">
								<Type class="mt-0.5 shrink-0 text-sky-600" size={20} />
								<span class="min-w-0 flex-1">
									<span class="block text-xs text-slate-400">标题</span>
									<span class="mt-1 block break-words text-base font-semibold text-slate-900">{todo.title}</span>
								</span>
								<Pencil class="mt-1 shrink-0 text-slate-300" size={16} />
							</button>
						{/if}
					</section>

					<section>
						{#if editingField === 'schedule'}
							<form class="py-4 pl-8" onsubmit={saveEditing}>
								<label class="block">
									<span class="mb-1.5 block text-xs text-slate-400">编辑计划时间</span>
									<Input type="datetime-local" bind:value={draftDateTime} required clearOnEscape={false} onEscape={cancelEditing} />
								</label>
								<div class="mt-3 flex justify-end gap-2">
									<Button onclick={cancelEditing}>取消</Button>
									<Button type="submit" variant="primary">保存</Button>
								</div>
							</form>
						{:else}
							<button type="button" class="flex w-full gap-3 py-4 text-left disabled:cursor-not-allowed disabled:opacity-50" data-field="schedule" onclick={startEditing} disabled={editingField !== null} aria-label="编辑计划时间">
								<CalendarClock class="mt-0.5 shrink-0 text-sky-600" size={20} />
								<span class="min-w-0 flex-1">
									<span class="block text-xs text-slate-400">计划时间</span>
									<time class="mt-1 block text-sm text-slate-700" datetime={todo.scheduledAt}>{formatSchedule(todo)}</time>
								</span>
								<Pencil class="mt-1 shrink-0 text-slate-300" size={16} />
							</button>
						{/if}
					</section>

					<section>
						{#if editingField === 'body'}
							<form class="py-4 pl-8" onsubmit={saveEditing}>
								<label class="block">
									<span class="mb-1.5 block text-xs text-slate-400">编辑正文</span>
									<textarea
										bind:value={draftBody}
										rows="5"
										maxlength="2000"
										class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
									></textarea>
								</label>
								<div class="mt-3 flex justify-end gap-2">
									<Button onclick={cancelEditing}>取消</Button>
									<Button type="submit" variant="primary">保存</Button>
								</div>
							</form>
						{:else}
							<button type="button" class="flex w-full gap-3 py-4 text-left disabled:cursor-not-allowed disabled:opacity-50" data-field="body" onclick={startEditing} disabled={editingField !== null} aria-label="编辑正文">
								<AlignLeft class="mt-0.5 shrink-0 text-sky-600" size={20} />
								<span class="min-w-0 flex-1">
									<span class="block text-xs text-slate-400">正文</span>
									<span class="mt-1 block whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{todo.body || '未填写正文'}</span>
								</span>
								<Pencil class="mt-1 shrink-0 text-slate-300" size={16} />
							</button>
						{/if}
					</section>
				</div>

				{#if !editingField}
					<div class="mt-6">
						<Button class="w-full" variant="ghost" onclick={showDeleteConfirm}>
							<span class="text-rose-600">删除待办</span>
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
