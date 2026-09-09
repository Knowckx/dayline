<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	let isUpdating = $state(false);
	let updateError = $state('');
	let updateCheckTimer: ReturnType<typeof setInterval> | null = null;
	let reloadTimer: ReturnType<typeof setTimeout> | null = null;

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		onRegisteredSW(_swScriptUrl, registration) {
			if (!registration) return;

			updateCheckTimer = setInterval(() => {
				void registration.update().catch((error) => {
					console.error('[PWA] SW update check error:', error);
				});
			}, 60 * 1000);
		},
		onNeedReload() {
			reloadPage();
		},
		onRegisterError(error) {
			console.error('[PWA] SW registration error:', error);
		}
	});

	// 清理刷新兜底并重新加载页面。
	function reloadPage() {
		if (reloadTimer) {
			clearTimeout(reloadTimer);
			reloadTimer = null;
		}
		window.location.reload();
	}

	function closePrompt() {
		needRefresh.set(false);
		offlineReady.set(false);
	}

	async function handleUpdate() {
		if (isUpdating) return;

		isUpdating = true;
		updateError = '';

		try {
			await updateServiceWorker();
			reloadTimer = setTimeout(reloadPage, 3000);
		} catch (error) {
			isUpdating = false;
			updateError = error instanceof Error ? error.message : '更新失败';
		}
	}

	onDestroy(() => {
		if (updateCheckTimer) clearInterval(updateCheckTimer);
		if (reloadTimer) clearTimeout(reloadTimer);
	});
</script>

{#if $needRefresh || $offlineReady}
	<div class="fixed right-5 bottom-5 z-50 flex max-w-80 flex-col gap-3 rounded-lg border bg-background p-4 text-foreground shadow-lg">
		<div>
			<p class="text-sm font-medium">
				{$needRefresh ? '发现新版本' : '已可离线使用'}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{$needRefresh
					? isUpdating
						? '正在应用新版本...'
						: '点击更新后会刷新页面。'
					: '核心资源已缓存。'}
			</p>
			{#if updateError}
				<p class="mt-1 text-sm text-red-600">{updateError}</p>
			{/if}
		</div>

		<div class="flex gap-2">
			{#if $needRefresh}
				<button
					class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-wait disabled:opacity-60"
					onclick={handleUpdate}
					disabled={isUpdating}
				>
					{isUpdating ? '更新中...' : '立即更新'}
				</button>
			{/if}
			<button
				class="rounded border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
				onclick={closePrompt}
				disabled={isUpdating}
			>
				关闭
			</button>
		</div>
	</div>
{/if}
