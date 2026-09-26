<script lang="ts">
	import { onMount } from 'svelte';
	import infa, { BottomNavigator, BottomNavigationController } from '@knowckx/infa-s5';
	import { CalendarDays, ListTodo, Plus, Settings, Sun } from '@lucide/svelte';
	import PWAUpdateController from '@/lib/components/PWAUpdateController.svelte';
	import TodoCreatePage from './pages/TodoCreatePage.svelte';
	import type { TodoCreateInput } from '@/lib/todos/todo';
	import { addTodo, refreshTodos } from '@/lib/todos/todo_state.svelte';
	import HomePage from './pages/HomePage.svelte';
	import BlankPage from './pages/BlankPage.svelte';
	import TodoLibraryPage from './pages/TodoLibraryPage.svelte';

	const navigation = new BottomNavigationController([
		{ id: 'todos', label: '待办库', root: { component: TodoLibraryPage }, icon: ListTodo },
		{ id: 'today', label: '今日', root: { component: BlankPage, props: { label: '今日' } }, icon: Sun },
		{ id: 'calendar', label: '日历', root: { component: HomePage }, icon: CalendarDays },
		{ id: 'settings', label: '设置', root: { component: BlankPage, props: { label: '设置' } }, icon: Settings }
	]); // 四个 Tab 的独立页面栈。
	const todoNav = navigation.get('todos'); // 待办库页面栈。

	onMount(refreshTodos);

	/** 从任意 Tab 进入待办库的创建页面。 */
	function handleFabClick() {
		navigation.select('todos');
		todoNav.reset();
		todoNav.push({
			component: TodoCreatePage,
			props: { onCancel: closeAddTodo, onSubmit: handleAddTodo },
			showTabBar: false
		});
	}

	/** 取消创建并返回待办库。 */
	function closeAddTodo() {
		todoNav.pop();
	}

	/** 创建并持久化待办。 */
	function handleAddTodo(input: TodoCreateInput) {
		try {
			addTodo(input);
			todoNav.reset();
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
		<BottomNavigator {navigation} fabIcon={Plus} onFabClick={handleFabClick} fabLabel="新增待办" />
	</div>
</div>

<style>
	.app-root {
		--infa-pwa-prompt-bottom: 6rem;
		background: #f8fafc;
	}
</style>
