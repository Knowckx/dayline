<script lang="ts">
	import { Button, Tip } from '@knowckx/infa-s5';
	import { addTodos } from '@/lib/todos/todo_state.svelte';
	import { presetTodos } from './preset_todos';

	interface Props {
		label: string; // 设置页面名称。
	}

	let { label }: Props = $props();

	/** 按配置表直接追加待办并提示结果。 */
	function handleInjectTodos() {
		try {
			const created = addTodos(presetTodos); // 本次插入的待办。
			Tip.success(`已注入 ${created.length} 条待办`);
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '注入待办失败');
		}
	}
</script>

<main class="h-full overflow-y-auto bg-slate-50 text-slate-900" aria-label={label}>
	<header class="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
		<h1 class="text-xl font-bold">{label}</h1>
	</header>
	<section class="px-5 py-6 sm:px-6" aria-labelledby="dev-tools-title">
		<h2 id="dev-tools-title" class="mb-3 text-sm font-medium text-slate-600">开发工具</h2>
		<div class="rounded-2xl bg-white p-5 shadow-sm">
			<p class="mb-4 text-sm text-slate-500">添加预先配置的待办，每次点击都会新增一批。</p>
			<Button type="button" variant="primary" onclick={handleInjectTodos}>注入预设待办</Button>
		</div>
	</section>
</main>
