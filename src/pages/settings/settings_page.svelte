<script lang="ts">
	import { Button, Tip } from '@knowckx/infa-s5';
	import { addTodos, clearTodos } from '@/lib/todos/todo_state.svelte';
	import { presetTodos } from './preset_todos';

	interface Props {
		label: string; // 设置页面名称。
	}

	let { label }: Props = $props();
	let clearDialog = $state<HTMLDialogElement>(); // 清空全部待办的原生二次确认弹层。

	/** 按标题补充缺失的预设待办，并提示新增、跳过或失败结果。 */
	function handleInjectTodos() {
		try {
			const created = addTodos(presetTodos); // 本次插入的待办。
			if (created.length === 0) {
				Tip.info('预设待办已全部存在');
				return;
			}
			Tip.success(`已新增 ${created.length} 条，跳过 ${presetTodos.length - created.length} 条`);
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '注入待办失败');
		}
	}

	/** 显示清空全部待办的二次确认。 */
	function showClearConfirm() {
		clearDialog?.showModal();
	}

	/** 取消清空并关闭确认框。 */
	function hideClearConfirm() {
		clearDialog?.close();
	}

	/** 确认后清空待办，失败时保留确认框并提示原因。 */
	function handleClearTodos() {
		try {
			clearTodos();
			clearDialog?.close();
			Tip.success('已清空所有待办');
		} catch (error) {
			Tip.error(error instanceof Error ? error.message : '清空待办失败');
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
			<p class="mb-4 text-sm text-slate-500">按内置配置补充待办，已有预设会跳过。</p>
			<div class="flex gap-3">
				<Button type="button" class="flex-1" variant="primary" onclick={handleInjectTodos}>注入预设待办</Button>
				<Button type="button" class="flex-1" variant="danger" onclick={showClearConfirm}>清空所有待办</Button>
			</div>
		</div>
	</section>
</main>

<dialog bind:this={clearDialog} class="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/35" aria-labelledby="clear-todos-title" aria-describedby="clear-todos-description">
	<h2 id="clear-todos-title" class="text-lg font-bold">清空所有待办？</h2>
	<p id="clear-todos-description" class="mt-2 text-sm leading-6 text-slate-500">
		所有手动创建和预设注入的待办都将永久删除，此操作无法撤销。今日时间记录将保留。
	</p>
	<div class="mt-6 flex gap-3">
		<Button type="button" class="flex-1" onclick={hideClearConfirm}>取消</Button>
		<Button type="button" class="flex-1" variant="danger" onclick={handleClearTodos}>确认清空</Button>
	</div>
</dialog>
