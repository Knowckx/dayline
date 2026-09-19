<script lang="ts">
	import infa from '@knowckx/infa-s5';
	import PWAUpdateController from '@/lib/components/PWAUpdateController.svelte';
	import HomePage from './pages/HomePage.svelte';
	import FileSystemAccessPage from './pages/FileSystemAccessPage.svelte';

	type RoutePath = '/' | '/file-system-access';

	let path = $state<RoutePath>(getRoutePath());

	function getRoutePath(): RoutePath {
		if (typeof window === 'undefined') return '/';
		return window.location.pathname === '/file-system-access' ? '/file-system-access' : '/';
	}

	function navigate(href: RoutePath) {
		if (window.location.pathname !== href) {
			window.history.pushState({}, '', href);
		}
		path = getRoutePath();
	}

	function handleClick(event: MouseEvent) {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const anchor = target.closest('a[data-app-link]');
		if (!(anchor instanceof HTMLAnchorElement)) return;

		const url = new URL(anchor.href);
		if (url.origin !== window.location.origin) return;
		if (url.pathname !== '/' && url.pathname !== '/file-system-access') return;

		event.preventDefault();
		navigate(url.pathname as RoutePath);
	}

	$effect(() => {
		const handlePopState = () => {
			path = getRoutePath();
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	});
</script>

<svelte:window onclick={handleClick} />

<PWAUpdateController />
<infa.Tip.UI />

{#if path === '/file-system-access'}
	<FileSystemAccessPage />
{:else}
	<HomePage />
{/if}
