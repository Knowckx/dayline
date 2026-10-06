<script lang="ts">
	import infa, { BottomNavigator, BottomNavigationController } from '@knowckx/infa-s5';
	import { CalendarDays, ListTodo, Plus, Settings, Sun } from '@lucide/svelte';
	import PWAUpdateController from '@/lib/components/PWAUpdateController.svelte';
	import TodoCreatePage from './pages/TodoCreatePage.svelte';
	import TodoDetailPage from './pages/todo_detail_page.svelte';
	import type { TodoCreateInput } from '@/lib/todos/todo';
	import { addTodo, todoState } from '@/lib/todos/todo_state.svelte';
	import HomePage from './pages/HomePage.svelte';
	import BlankPage from './pages/BlankPage.svelte';
	import TodayPage from './pages/today_page.svelte';
	import TodoLibraryPage from './pages/TodoLibraryPage.svelte';

	const navigation = new BottomNavigationController([
		{ id: 'todos', label: '待办库', root: { component: TodoLibraryPage, props: {
			onOpenTodo: handleOpenTodo,
			/** 随主导航切换向待办库传递激活状态。 */
			get isActive() { return navigation.activeId === 'todos'; }
		} }, icon: ListTodo },
		{ id: 'today', label: '今日', root: { component: TodayPage, props: {
			/** 今日页的快捷键随主导航激活，计时状态独立保留。 */
			get isActive() { return navigation.activeId === 'today'; }
		} }, icon: Sun },
		{ id: 'calendar', label: '日历', root: { component: HomePage }, icon: CalendarDays },
		{ id: 'settings', label: '设置', root: { component: BlankPage, props: { label: '设置' } }, icon: Settings }
	]); // 四个 Tab 的独立页面栈。
	const todoNav = navigation.get('todos'); // 待办库页面栈。

	/** 根据原始待办进入详情页，单次与重复共用同一页面。 */
	function handleOpenTodo(id: string) {
		for (const todo of todoState.todos) {
			if (todo.id !== id) continue;
			todoNav.push({ component: TodoDetailPage, props: { todo, onClose: closeTodoDetail }, showTabBar: false });
			return;
		}
	}

	/** 详情保存、取消或删除后返回待办库。 */
	function closeTodoDetail() {
		todoNav.pop();
	}

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
