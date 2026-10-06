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

Capacitor 配置与 `android/` 原生工程已生成。Android 专用构建和 Service Worker 注册隔离尚未完成，APK 与真机运行尚未验证。

完成构建分流后，开发流程为：

`构建 Android Web 资源 → pnpm exec cap sync android → pnpm exec cap open android → Android Studio 构建与运行`

`android/` 是纳入 Git 的原生工程；构建产物和同步复制的 Web 资源由其 `.gitignore` 排除。工程约束与进度以项目开发文档为准。
