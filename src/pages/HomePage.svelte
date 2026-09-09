<script lang="ts">
	import infa from '@knowckx/infa-s5';

	console.log(`Infa 版本 ${infa.version}`);
</script>

<main class="p-8">
	<h1>Infa 版本 {infa.version}</h1>
	<infa.Button
		onclick={() => {
			infa.Tip.success(`Infa 版本 ${infa.version}`);
		}}
	>
		点击提示
	</infa.Button>

	<infa.Button
		variant="danger"
		class="ml-4"
		onclick={() => {
			infa.Tip.error('出错了！');
		}}
	>
		错误提示
	</infa.Button>

	<infa.Button
		variant="secondary"
		class="ml-4"
		onclick={() => {
			infa.Tip.info('这是一条消息');
		}}
	>
		普通提示
	</infa.Button>

	<a
		href="/file-system-access"
		data-app-link
		class="ml-4 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
	>
		File System Access API
	</a>
</main>
