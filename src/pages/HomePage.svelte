<script lang="ts">
	import MonthCalendar from '@/lib/components/MonthCalendar.svelte';
</script>

<main class="min-h-dvh bg-slate-50 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
	<div class="mx-auto max-w-2xl">
		<header class="mb-4 px-1 sm:mb-6">
			<h1 class="text-2xl font-bold tracking-tight">Dayline</h1>
			<p class="mt-1 text-sm text-slate-500">月历</p>
		</header>

		<MonthCalendar />
	</div>
</main>
