<script lang="ts">
	import { Button } from '@knowckx/infa-s5';
	import TodoForm from './components/todo_form.svelte';
	import { toTodoSchedule, type TodoCreateInput } from '@/lib/todos/todo';

	interface Props {
		onCancel: () => void; // 取消并返回待办库。
		onSubmit: (input: TodoCreateInput) => void; // 提交创建草稿。
	}

	const tomorrow = new Date(); // 新建待办默认安排在本地明天。
	tomorrow.setDate(tomorrow.getDate() + 1);
	let { onCancel, onSubmit }: Props = $props();
	let input = $state<TodoCreateInput>({
		title: '', body: '', scheduledDate: toTodoSchedule(tomorrow).scheduledDate, scheduledTime: '00:00',
		type_int: 10, additional: ''
	}); // 新增表单草稿。

	/** 提交新增待办。 */
	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onSubmit(input);
	}

	/** Escape 取消创建并返回待办库。 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !event.defaultPrevented) onCancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="flex h-full min-h-0 flex-col bg-white text-slate-900" aria-labelledby="add-todo-title">
	<header class="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
		<h1 id="add-todo-title" class="text-xl font-bold">新增待办</h1>
	</header>
	<form class="flex min-h-0 flex-1 flex-col" onsubmit={handleSubmit}>
		<TodoForm bind:input autoFocus />
		<footer class="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
			<Button type="button" class="flex-1" onclick={onCancel}>取消</Button>
			<Button type="submit" variant="primary" class="flex-1" disabled={!input.title.trim()}>创建</Button>
		</footer>
	</form>
</main>
