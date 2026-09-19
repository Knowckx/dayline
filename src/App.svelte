<script lang="ts">
	import infa, { BottomNavigator, type BottomNavigationTabs } from '@knowckx/infa-s5';
	import { CalendarDays, ListTodo, Plus, Settings, Sun } from '@lucide/svelte';
	import PWAUpdateController from '@/lib/components/PWAUpdateController.svelte';
	import HomePage from './pages/HomePage.svelte';
	import BlankPage from './pages/BlankPage.svelte';

	const tabs = [
		{ id: 'calendar', label: '日历', component: HomePage, icon: CalendarDays },
		{ id: 'today', label: '今日', component: BlankPage, icon: Sun, props: { label: '今日' } },
		{ id: 'todos', label: '待办库', component: BlankPage, icon: ListTodo, props: { label: '待办库' } },
		{ id: 'settings', label: '设置', component: BlankPage, icon: Settings, props: { label: '设置' } }
	] satisfies BottomNavigationTabs; // 四个主页面按底部导航从左到右排列。

	/** 在待办新增功能完成前提供明确反馈。 */
	function handleFabClick() {
		infa.Tip.info('新增待办功能待实现');
	}
</script>

<div class="app-root">
	<PWAUpdateController />
	<infa.Tip.UI />

	<div class="mx-auto h-dvh max-w-2xl overflow-hidden shadow-sm">
		<BottomNavigator {tabs} fabIcon={Plus} onFabClick={handleFabClick} fabLabel="新增待办" />
	</div>
</div>

<style>
	.app-root {
		--infa-pwa-prompt-bottom: 6rem;
		background: #f8fafc;
	}
</style>
