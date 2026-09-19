<script lang="ts">
	interface Props {
		label: string;
	}

	let { label }: Props = $props();
</script>

<main class="h-full overflow-y-auto bg-slate-50" aria-label={label}></main>
