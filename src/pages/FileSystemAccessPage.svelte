<script lang="ts">
	import { onMount } from 'svelte';

	type AccessMode = 'read' | 'readwrite';
	type EntryKind = 'file' | 'directory';

	type WritableFileStreamLike = {
		write(data: string | Blob | ArrayBuffer | Uint8Array): Promise<void>;
		close(): Promise<void>;
	};

	type HandleLike = {
		kind: EntryKind;
		name: string;
		queryPermission?: (options?: { mode?: AccessMode }) => Promise<PermissionState>;
		requestPermission?: (options?: { mode?: AccessMode }) => Promise<PermissionState>;
		remove?: (options?: { recursive?: boolean }) => Promise<void>;
	};

	type FileHandleLike = HandleLike & {
		kind: 'file';
		getFile(): Promise<File>;
		createWritable(options?: { keepExistingData?: boolean }): Promise<WritableFileStreamLike>;
	};

	type DirectoryHandleLike = HandleLike & {
		kind: 'directory';
		entries(): AsyncIterable<[string, HandleLike]>;
		getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
		removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
	};

	type PickerApi = Window & {
		showOpenFilePicker?: (options?: {
			multiple?: boolean;
			excludeAcceptAllOption?: boolean;
			types?: Array<{ description: string; accept: Record<string, string[]> }>;
		}) => Promise<FileHandleLike[]>;
		showDirectoryPicker?: (options?: { mode?: AccessMode }) => Promise<DirectoryHandleLike>;
		showSaveFilePicker?: (options?: {
			suggestedName?: string;
			types?: Array<{ description: string; accept: Record<string, string[]> }>;
		}) => Promise<FileHandleLike>;
	};

	type StorageManagerWithDirectory = StorageManager & {
		getDirectory?: () => Promise<DirectoryHandleLike>;
	};

	type SupportState = {
		openFile: boolean;
		directory: boolean;
		saveFile: boolean;
		opfs: boolean;
		secureContext: boolean;
	};

	type SelectedFile = {
		name: string;
		size: number;
		type: string;
		lastModified: string;
	};

	type DirectoryEntry = {
		name: string;
		kind: EntryKind;
	};

	let support = $state<SupportState>({
		openFile: false,
		directory: false,
		saveFile: false,
		opfs: false,
		secureContext: false
	});
	let status = $state('等待操作');
	let selectedFile = $state<SelectedFile | null>(null);
	let fileText = $state('');
	let directoryHandle = $state<DirectoryHandleLike | null>(null);
	let directoryEntries = $state<DirectoryEntry[]>([]);
	let saveText = $state('Hello File System Access API\n');
	let directoryFileName = $state('fsa-demo.txt');
	let recursiveDelete = $state(false);
	let opfsText = $state('这段内容会写入 OPFS 沙盒文件。');
	let opfsResult = $state('');

	const textFileTypes = [
		{
			description: 'Text files',
			accept: {
				'text/plain': ['.txt', '.md', '.csv', '.log'],
				'application/json': ['.json']
			}
		}
	];

	onMount(() => {
		const picker = getPickerApi();
		const storage = navigator.storage as StorageManagerWithDirectory | undefined;

		support = {
			openFile: typeof picker.showOpenFilePicker === 'function',
			directory: typeof picker.showDirectoryPicker === 'function',
			saveFile: typeof picker.showSaveFilePicker === 'function',
			opfs: typeof storage?.getDirectory === 'function',
			secureContext: window.isSecureContext
		};
	});

	function getPickerApi() {
		return window as PickerApi;
	}

	function formatBytes(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function getErrorMessage(error: unknown) {
		if (error instanceof DOMException && error.name === 'AbortError') return '用户取消了操作';
		if (error instanceof DOMException && error.name === 'NotAllowedError') return '权限被拒绝';
		if (error instanceof DOMException && error.name === 'NotFoundError') return '目标不存在';
		if (error instanceof DOMException && error.name === 'InvalidModificationError') {
			return '目录非空，不能按普通删除处理';
		}
		if (error instanceof Error) return error.message;
		return '未知错误';
	}

	async function ensurePermission(handle: HandleLike, mode: AccessMode) {
		const current = await handle.queryPermission?.({ mode });
		if (current === 'granted') return true;

		const requested = await handle.requestPermission?.({ mode });
		return requested === 'granted' || requested === undefined;
	}

	async function openTextFile() {
		try {
			const picker = getPickerApi();
			if (!picker.showOpenFilePicker) {
				status = '当前浏览器不支持 showOpenFilePicker';
				return;
			}

			const [fileHandle] = await picker.showOpenFilePicker({
				types: textFileTypes,
				excludeAcceptAllOption: false,
				multiple: false
			});
			const file = await fileHandle.getFile();

			selectedFile = {
				name: file.name,
				size: file.size,
				type: file.type || 'unknown',
				lastModified: new Date(file.lastModified).toLocaleString()
			};
			fileText = await file.text();
			status = `已读取 ${file.name}`;
		} catch (error) {
			status = getErrorMessage(error);
		}
	}

	async function chooseDirectory() {
		try {
			const picker = getPickerApi();
			if (!picker.showDirectoryPicker) {
				status = '当前浏览器不支持 showDirectoryPicker';
				return;
			}

			directoryHandle = await picker.showDirectoryPicker({ mode: 'readwrite' });
			await refreshDirectory();
			status = `已选择目录 ${directoryHandle.name}`;
		} catch (error) {
			status = getErrorMessage(error);
		}
	}

	async function refreshDirectory() {
		if (!directoryHandle) return;

		const nextEntries: DirectoryEntry[] = [];
		for await (const [name, handle] of directoryHandle.entries()) {
			nextEntries.push({ name, kind: handle.kind });
		}

		directoryEntries = nextEntries.sort((a, b) => {
			if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
	}

	async function saveAsFile() {
		try {
			const picker = getPickerApi();
			if (!picker.showSaveFilePicker) {
				status = '当前浏览器不支持 showSaveFilePicker';
				return;
			}

			const fileHandle = await picker.showSaveFilePicker({
				suggestedName: directoryFileName || 'fsa-demo.txt',
				types: textFileTypes
			});
			await writeFileHandle(fileHandle, saveText);
			status = `已保存 ${fileHandle.name}`;
		} catch (error) {
			status = getErrorMessage(error);
		}
	}

	async function writeIntoSelectedDirectory() {
		try {
			if (!directoryHandle) {
				status = '请先选择目录';
				return;
			}

			const fileName = directoryFileName.trim();
			if (!fileName) {
				status = '文件名不能为空';
				return;
			}

			const granted = await ensurePermission(directoryHandle, 'readwrite');
			if (!granted) {
				status = '没有目录写入权限';
				return;
			}

			const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
			await writeFileHandle(fileHandle, saveText);
			await refreshDirectory();
			status = `已写入 ${fileName}`;
		} catch (error) {
			status = getErrorMessage(error);
		}
	}

	async function writeFileHandle(fileHandle: FileHandleLike, content: string) {
		const writable = await fileHandle.createWritable();
		await writable.write(content);
		await writable.close();
	}

	async function deleteDirectoryEntry(entry: DirectoryEntry) {
		try {
			if (!directoryHandle) {
				status = '请先选择目录';
				return;
			}

			const recursive = entry.kind === 'directory' && recursiveDelete;
			const message = recursive
				? `确认递归删除目录 "${entry.name}" 及其全部内容？`
				: `确认删除 "${entry.name}"？`;
			if (!window.confirm(message)) {
				status = '已取消删除';
				return;
			}

			const granted = await ensurePermission(directoryHandle, 'readwrite');
			if (!granted) {
				status = '没有目录删除权限';
				return;
			}

			await directoryHandle.removeEntry(entry.name, { recursive });
			await refreshDirectory();
			status = `已删除 ${entry.name}`;
		} catch (error) {
			status = getErrorMessage(error);
		}
	}

	async function writeOpfsFile() {
		try {
			const storage = navigator.storage as StorageManagerWithDirectory | undefined;
			if (!storage?.getDirectory) {
				status = '当前浏览器不支持 OPFS';
				return;
			}

			const root = await storage.getDirectory();
			const fileHandle = await root.getFileHandle('opfs-demo.txt', { create: true });
			await writeFileHandle(fileHandle, opfsText);

			const file = await fileHandle.getFile();
			opfsResult = await file.text();
			status = '已写入并读取 OPFS 文件 opfs-demo.txt';
		} catch (error) {
			status = getErrorMessage(error);
		}
	}

	async function deleteOpfsFile() {
		try {
			const storage = navigator.storage as StorageManagerWithDirectory | undefined;
			if (!storage?.getDirectory) {
				status = '当前浏览器不支持 OPFS';
				return;
			}

			const root = await storage.getDirectory();
			await root.removeEntry('opfs-demo.txt');
			opfsResult = '';
			status = '已删除 OPFS 文件 opfs-demo.txt';
		} catch (error) {
			status = getErrorMessage(error);
		}
	}
</script>

<svelte:head>
	<title>File System Access API</title>
</svelte:head>

<main class="min-h-screen bg-background px-6 py-8 text-foreground">
	<div class="mx-auto flex max-w-6xl flex-col gap-6">
		<header class="flex flex-col gap-3 border-b pb-5">
			<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div>
					<p class="text-sm text-muted-foreground">浏览器本地文件能力测试</p>
					<h1 class="text-3xl font-semibold">File System Access API</h1>
				</div>
				<a
					href="/"
					data-app-link
					class="inline-flex h-9 items-center justify-center rounded border px-3 text-sm hover:bg-accent hover:text-accent-foreground"
				>
					返回首页
				</a>
			</div>
			<div class="flex flex-wrap gap-2 text-sm">
				<span class="rounded border px-2 py-1">安全上下文：{support.secureContext ? '可用' : '不可用'}</span>
				<span class="rounded border px-2 py-1">读文件：{support.openFile ? '支持' : '不支持'}</span>
				<span class="rounded border px-2 py-1">选目录：{support.directory ? '支持' : '不支持'}</span>
				<span class="rounded border px-2 py-1">保存文件：{support.saveFile ? '支持' : '不支持'}</span>
				<span class="rounded border px-2 py-1">OPFS：{support.opfs ? '支持' : '不支持'}</span>
			</div>
			<p class="rounded bg-muted px-3 py-2 text-sm text-muted-foreground">{status}</p>
		</header>

		<section class="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
			<div class="rounded border p-4">
				<div class="mb-4 flex items-center justify-between gap-3">
					<h2 class="text-lg font-medium">读取单个文本文件</h2>
					<button
						class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!support.openFile}
						onclick={openTextFile}
					>
						选择文件
					</button>
				</div>

				{#if selectedFile}
					<dl class="grid grid-cols-[88px_1fr] gap-2 text-sm">
						<dt class="text-muted-foreground">名称</dt>
						<dd class="break-all">{selectedFile.name}</dd>
						<dt class="text-muted-foreground">大小</dt>
						<dd>{formatBytes(selectedFile.size)}</dd>
						<dt class="text-muted-foreground">类型</dt>
						<dd>{selectedFile.type}</dd>
						<dt class="text-muted-foreground">修改时间</dt>
						<dd>{selectedFile.lastModified}</dd>
					</dl>
				{:else}
					<p class="text-sm text-muted-foreground">尚未读取文件。</p>
				{/if}
			</div>

			<div class="rounded border p-4">
				<h2 class="mb-4 text-lg font-medium">文件内容</h2>
				<pre class="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-sm">{fileText || '...'}</pre>
			</div>
		</section>

		<section class="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
			<div class="rounded border p-4">
				<div class="mb-4 flex items-center justify-between gap-3">
					<h2 class="text-lg font-medium">选择目录</h2>
					<div class="flex gap-2">
						<button
							class="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!directoryHandle}
							onclick={refreshDirectory}
						>
							刷新
						</button>
						<button
							class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!support.directory}
							onclick={chooseDirectory}
						>
							选择目录
						</button>
					</div>
				</div>

				<p class="mb-4 text-sm text-muted-foreground">
					当前目录：{directoryHandle?.name ?? '未选择'}
				</p>

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={recursiveDelete} />
					允许递归删除非空目录
				</label>
			</div>

			<div class="rounded border p-4">
				<h2 class="mb-4 text-lg font-medium">目录一级列表</h2>
				{#if directoryEntries.length > 0}
					<ul class="divide-y rounded border">
						{#each directoryEntries as entry (entry.kind + entry.name)}
							<li class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
								<span class="min-w-0 truncate">
									<span class="mr-2 text-muted-foreground">{entry.kind === 'directory' ? 'DIR' : 'FILE'}</span>
									{entry.name}
								</span>
								<button
									class="shrink-0 rounded border border-destructive px-2 py-1 text-destructive"
									onclick={() => deleteDirectoryEntry(entry)}
								>
									删除
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-muted-foreground">目录列表为空或未选择目录。</p>
				{/if}
			</div>
		</section>

		<section class="rounded border p-4">
			<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h2 class="text-lg font-medium">写入文件</h2>
					<p class="text-sm text-muted-foreground">可另存为任意位置，也可写入已选择目录。</p>
				</div>
				<label class="flex flex-col gap-1 text-sm md:w-72">
					<span class="text-muted-foreground">目录内文件名</span>
					<input class="rounded border bg-background px-3 py-2" bind:value={directoryFileName} />
				</label>
			</div>

			<textarea
				class="mb-3 min-h-36 w-full rounded border bg-background p-3 text-sm"
				bind:value={saveText}
				spellcheck="false"
			></textarea>

			<div class="flex flex-wrap gap-2">
				<button
					class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!support.saveFile}
					onclick={saveAsFile}
				>
					另存为文件
				</button>
				<button
					class="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!directoryHandle}
					onclick={writeIntoSelectedDirectory}
				>
					写入所选目录
				</button>
			</div>
		</section>

		<section class="grid gap-4 lg:grid-cols-[1fr_1fr]">
			<div class="rounded border p-4">
				<h2 class="mb-3 text-lg font-medium">OPFS 沙盒读写</h2>
				<textarea
					class="mb-3 min-h-28 w-full rounded border bg-background p-3 text-sm"
					bind:value={opfsText}
					spellcheck="false"
				></textarea>
				<div class="flex flex-wrap gap-2">
					<button
						class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!support.opfs}
						onclick={writeOpfsFile}
					>
						写入 OPFS
					</button>
					<button
						class="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!support.opfs}
						onclick={deleteOpfsFile}
					>
						删除 OPFS 文件
					</button>
				</div>
			</div>

			<div class="rounded border p-4">
				<h2 class="mb-3 text-lg font-medium">OPFS 读取结果</h2>
				<pre class="min-h-28 whitespace-pre-wrap rounded bg-muted p-3 text-sm">{opfsResult || '...'}</pre>
			</div>
		</section>
	</div>
</main>
