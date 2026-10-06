# Dayline

项目开发文档入口：`E:/dev/ai-prompts/repos/3.dayline/1.入口.md`。

## 本地启动

```powershell
Set-Location E:\dev\nodejs
pnpm install

Set-Location E:\dev\nodejs\infa-s5
pnpm build

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

## Android

Capacitor 配置与 `android/` 原生工程已生成。Android 构建使用 `capacitor` 模式，排除 PWA 插件与 Service Worker 注册控制器；Web 构建保留现有更新提示策略。APK 与真机运行尚未验证。

仅构建 Android Web 资源：

```powershell
pnpm build:android
```

构建并同步原生工程：

```powershell
pnpm android:sync
```

构建、同步并打开 Android Studio：

```powershell
pnpm android
```

`pnpm android → Android Web 构建 → cap sync android → cap open android → Android Studio 构建与运行`

两种构建均输出到 `dist/`，后执行的构建覆盖前一次产物；运行 PWA 预览前使用 `pnpm build` 或 `pnpm pwa`。

`android/` 是纳入 Git 的原生工程；构建产物和同步复制的 Web 资源由其 `.gitignore` 排除。工程约束与进度以项目开发文档为准。
