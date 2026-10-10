# Dayline

项目开发文档入口：`E:/dev/ai-prompts/repos/3.dayline/1.入口.md`。

### 预设待办配置表

编辑[配置表](src/pages/settings/preset_todos.ts)
在“设置 → 开发工具 → 注入预设待办”中执行注入。

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

一键生成可直接安装的 debug APK（Windows / PowerShell 7）：

```powershell
pnpm apk
```

`pnpm apk → Android Web 构建 → cap sync android → Gradle assembleDebug → temp/app-debug.apk`

成功后自动创建项目根目录的 `temp/` 并覆盖其中的 `app-debug.apk`；该目录已加入 Git 忽略。Gradle 默认产物仍保留在 `android/app/build/outputs/apk/debug/`。APK 实际构建与真机运行尚未验证。

构建前需配置 JDK 21 的 `JAVA_HOME`；Android SDK 路径使用本机 `android/local.properties`。当前机器已安装的 JDK 可在终端中设置：

```powershell
$env:JAVA_HOME = 'D:\app_data\scoop\apps\temurin21-jdk\current'
```

两种构建均输出到 `dist/`，后执行的构建覆盖前一次产物；运行 PWA 预览前使用 `pnpm build` 或 `pnpm pwa`。

`android/` 是纳入 Git 的原生工程；构建产物和同步复制的 Web 资源由其 `.gitignore` 排除。工程约束与进度以项目开发文档为准。
