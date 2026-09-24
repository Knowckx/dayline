<script lang="ts">
	import { onMount } from 'svelte';
	import infa, { BottomNavigator, bottomNavigationState, type BottomNavigationTabs } from '@knowckx/infa-s5';
	import { CalendarDays, ListTodo, Plus, Settings, Sun } from '@lucide/svelte';
	import PWAUpdateController from '@/lib/components/PWAUpdateController.svelte';
	import AddTodoDialog from '@/lib/components/AddTodoDialog.svelte';
	import type { TodoCreateInput } from '@/lib/todos/todo';
	import { addTodo, refreshTodos } from '@/lib/todos/todo_state.svelte';
	import HomePage from './pages/HomePage.svelte';
	import BlankPage from './pages/BlankPage.svelte';
	import TodoLibraryPage from './pages/TodoLibraryPage.svelte';

	const tabs = [
		{ id: 'todos', label: '待办库', component: TodoLibraryPage, icon: ListTodo },
		{ id: 'today', label: '今日', component: BlankPage, icon: Sun, props: { label: '今日' } },
		{ id: 'calendar', label: '日历', component: HomePage, icon: CalendarDays },
		{ id: 'settings', label: '设置', component: BlankPage, icon: Settings, props: { label: '设置' } }
	] satisfies BottomNavigationTabs; // 四个主页面按底部导航从左到右排列。
	let isAddTodoOpen = $state(false); // 是否显示新增待办弹层。

	onMount(refreshTodos);

	/** 打开新增待办弹层。 */
	function handleFabClick() {
		isAddTodoOpen = true;
	}

	/** 关闭新增待办弹层。 */
	function closeAddTodo() {
		isAddTodoOpen = false;
	}

	/** 创建并持久化待办。 */
	function handleAddTodo(input: TodoCreateInput) {
		try {
			addTodo(input);
			isAddTodoOpen = false;
			bottomNavigationState.activeId = 'todos';
			infa.Tip.success('待办已创建');
		} catch (error) {
			const message = error instanceof Error ? error.message : '保存待办失败';
			infa.Tip.error(message);
		}
	}
</script>

<div class="app-root">
	<PWAUpdateController />
	<infa.Tip.UI />

	<div class="mx-auto h-dvh max-w-2xl overflow-hidden shadow-sm">
		<BottomNavigator {tabs} fabIcon={Plus} onFabClick={handleFabClick} fabLabel="新增待办" />
	</div>

	{#if isAddTodoOpen}
		<AddTodoDialog onCancel={closeAddTodo} onSubmit={handleAddTodo} />
	{/if}
</div>

<style>
	.app-root {
		--infa-pwa-prompt-bottom: 6rem;
		background: #f8fafc;
	}
</style>
