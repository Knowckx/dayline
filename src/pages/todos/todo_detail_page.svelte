<script lang="ts">
	import { untrack } from 'svelte';
	import { Trash2 } from '@lucide/svelte';
	import { Button, Tip } from '@knowckx/infa-s5';
	import TodoForm from './components/todo_form.svelte';
	import type { Todo, TodoCreateInput } from '@/lib/todos/todo';
	import { deleteTodo, editTodo } from '@/lib/todos/todo_state.svelte';

	interface Props {
		todo: Todo; // 打开详情时的原始待办。
		onClose: () => void; // 返回来源页面。
	}

	let { todo, onClose }: Props = $props();
	let input = $state<TodoCreateInput>(untrack(createDraft)); // 独立草稿，取消时直接丢弃。
	let deleteDialog = $state<HTMLDialogElement>(); // 原生删除确认弹层。

	/** 载入原始规则，保留已保存的月末模式。 */
	function createDraft(): TodoCreateInput {
		return {
			title: todo.title, body: todo.body,
			scheduledDate: [...todo.scheduledDate], scheduledTime: todo.scheduledTime,
			type_int: todo.type_int, additional: todo.additional
		};
	}

	/** 一次保存全部字段，成功后返回列表。 */
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		try {
			editTodo(todo.id, input);
			Tip.success('待办已更新');
			onClose();
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '更新待办失败');
		}
	}

	/** 显示删除二次确认。 */
	function showDeleteConfirm() {
		deleteDialog?.showModal();
	}

	/** 取消删除，保留编辑草稿。 */
	function hideDeleteConfirm() {
		deleteDialog?.close();
	}

	/** 删除整条待办及重复规则，成功后返回列表。 */
	function handleDelete() {
		try {
			deleteTodo(todo.id);
			deleteDialog?.close();
			Tip.success('待办已删除');
			onClose();
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '删除待办失败');
		}
	}

	/** 确认框由原生 Escape 关闭，页面 Escape 放弃草稿并返回。 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !event.defaultPrevented && !deleteDialog?.open) onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="flex h-full min-h-0 flex-col bg-white text-slate-900" aria-labelledby="todo-detail-title">
	<header class="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
		<h1 id="todo-detail-title" class="text-xl font-bold">待办详情</h1>
		<button type="button" class="-my-2 -mr-2 flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-rose-600 hover:bg-rose-50" onclick={showDeleteConfirm} aria-label="删除待办">
			<Trash2 size={18} />删除
		</button>
	</header>
	<form class="flex min-h-0 flex-1 flex-col" onsubmit={handleSubmit}>
		<TodoForm bind:input />
		<footer class="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
			<Button type="button" class="flex-1" onclick={onClose}>取消</Button>
			<Button type="submit" variant="primary" class="flex-1" disabled={!input.title.trim()}>保存</Button>
		</footer>
	</form>
</main>

<dialog bind:this={deleteDialog} class="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/35" aria-labelledby="delete-todo-title" aria-describedby="delete-todo-description">
	<h2 id="delete-todo-title" class="text-lg font-bold">删除这条待办？</h2>
	<p id="delete-todo-description" class="mt-2 break-words text-sm leading-6 text-slate-500">
		“{todo.title}”将从本地永久删除，此操作无法撤销。
		{#if todo.type_int !== 10}整条重复规则将一并删除，之后将不再出现。{/if}
	</p>
	<div class="mt-6 flex gap-3">
		<Button type="button" class="flex-1" onclick={hideDeleteConfirm}>取消</Button>
		<Button type="button" class="flex-1" variant="danger" onclick={handleDelete}>确认删除</Button>
	</div>
</dialog>
