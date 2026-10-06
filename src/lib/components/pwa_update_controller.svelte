<script lang="ts">
	import { PWAUpdatePrompt, type PWAUpdateStatus } from '@knowckx/infa-s5';
	import { onDestroy } from 'svelte';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	let isUpdating = $state(false); // 是否正在应用新版本。
	let updateError = $state(''); // 最近一次更新错误。
	let updateCheckTimer: ReturnType<typeof setInterval> | null = null; // 定时检查任务。
	let reloadTimer: ReturnType<typeof setTimeout> | null = null; // 更新后的刷新兜底任务。
	let serviceWorkerRegistration: ServiceWorkerRegistration | null = null; // 当前 Service Worker 注册。

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		onRegisteredSW: handleRegisteredSW,
		onNeedReload: reloadPage,
		onRegisterError: handleRegisterError
	});

	let promptStatus: PWAUpdateStatus = $derived(
		isUpdating ? 'updating' : $needRefresh ? 'update-ready' : 'offline-ready'
	);

	/** 保存注册并启动版本检查。 */
	function handleRegisteredSW(_swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) {
		if (!registration) return;

		serviceWorkerRegistration = registration;
		updateCheckTimer = setInterval(checkForUpdate, 60 * 1000);
	}

	/** 请求 Service Worker 检查新版本。 */
	function checkForUpdate() {
		if (!serviceWorkerRegistration) return;
		void serviceWorkerRegistration.update().catch(handleUpdateCheckError);
	}

	/** 记录版本检查错误。 */
	function handleUpdateCheckError(error: unknown) {
		console.error('[PWA] SW update check error:', error);
	}

	/** 记录 Service Worker 注册错误。 */
	function handleRegisterError(error: unknown) {
		console.error('[PWA] SW registration error:', error);
	}

	/** 清理刷新兜底并重新加载页面。 */
	function reloadPage() {
		if (reloadTimer) {
			clearTimeout(reloadTimer);
			reloadTimer = null;
		}
		window.location.reload();
	}

	/** 关闭当前 PWA 提示。 */
	function closePrompt() {
		needRefresh.set(false);
		offlineReady.set(false);
	}

	/** 应用等待中的 Service Worker 更新。 */
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

	/** 清理控制器创建的定时任务。 */
	function cleanupTimers() {
		if (updateCheckTimer) clearInterval(updateCheckTimer);
		if (reloadTimer) clearTimeout(reloadTimer);
	}

	onDestroy(cleanupTimers);
</script>

{#if $needRefresh || $offlineReady}
	<PWAUpdatePrompt
		status={promptStatus}
		error={updateError}
		onUpdate={handleUpdate}
		onClose={closePrompt}
	/>
{/if}
