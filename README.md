# Dayline

Web-first 的个人日历待办应用，目标平台为 Web/PWA 和 Android。

当前处于 Pre.1 基础整理阶段。现有工程已接入 Svelte 5、TypeScript、Vite、Tailwind CSS 4、PWA 和工作区通用组件，日历待办业务尚未实现。

## 本地启动

```powershell
Set-Location E:\dev\nodejs
pnpm install

Set-Location E:\dev\nodejs\dayline
pnpm dev
```

开发地址：`https://localhost:23006`

生产构建与 PWA 预览：

```powershell
pnpm build
pnpm preview
```

预览地址：`https://localhost:33006`

## 当前页面

- `/`：临时首页。
- `/file-system-access`：File System Access API 与 OPFS 教学页，详见 [`src/pages/FileSystemAccessPage.README.md`](src/pages/FileSystemAccessPage.README.md)。
