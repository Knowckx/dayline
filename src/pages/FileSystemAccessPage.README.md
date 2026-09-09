# File System Access API 教学页

目标路由：`/file-system-access`

页面文件：`FileSystemAccessPage.svelte`

## 教学目标

- 检测浏览器是否支持 File System Access API。
- 读取用户主动选择的单个文本文件。
- 选择目录并展示一级文件/文件夹列表。
- 创建或覆盖一个文件，观察浏览器权限提示。
- 删除目录中的文件或文件夹，理解危险操作的确认流程。
- 对比用户可见文件系统和 OPFS 的差异。

## 已实现能力

- 能力检测：安全上下文、读文件、选目录、保存文件、OPFS。
- 单文件读取：读取文本类文件元信息和内容。
- 目录读取：选择目录后展示一级文件/文件夹列表。
- 文件写入：通过保存选择器写入，或写入当前选择目录。
- 删除：删除当前目录中的一级文件/文件夹，递归删除需要显式勾选。
- OPFS：写入、读取、删除 `opfs-demo.txt`。

## 建议实现顺序

1. 基础能力检测：`showOpenFilePicker`、`showDirectoryPicker`、`showSaveFilePicker`。
2. 单文件读取：选择 `.txt/.md/.json`，读取名称、大小、类型和文本内容。
3. 目录读取：选择目录，遍历一级 `entries()`，区分 file/directory。
4. 文件写入：通过 `showSaveFilePicker()` 写入 textarea 内容。
5. 文件删除：选择目录后，通过 `directoryHandle.removeEntry(name)` 删除一级子项。
6. 目录删除：演示删除空目录；非空目录需要 `removeEntry(name, { recursive: true })`。
7. 权限体验：展示用户取消、权限拒绝、API 不支持、删除失败四类状态。
8. 进阶：演示 OPFS `navigator.storage.getDirectory()` 的沙盒文件读写。
9. 进阶对比：说明 `FileSystemHandle.remove()` 可直接删除 handle，但属于实验/非标准能力，示例中不作为主路径。

## 删除教学注意点

- 不做“批量删除”和“递归删除默认开启”，避免误操作。
- UI 上先展示待删除名称，再要求用户二次确认。
- 删除后立即重新读取目录列表，确保界面和真实文件系统同步。
- 捕获 `NotAllowedError`、`NotFoundError`、`InvalidModificationError`，把错误翻译成可理解状态。
