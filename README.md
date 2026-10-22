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

## 手机局域网访问与证书

运行 `pnpm pwa` 可构建 Web/PWA 并启动预览服务。手机与电脑处于同一局域网、电脑预览服务运行且防火墙允许对应端口时，手机使用终端输出的 WLAN 地址访问。

本轮地址示例：`https://192.168.4.102:33006/`。IP 变化后使用新的地址；手机、PC 和不同访问地址的数据分别保存在各自浏览器来源下，当前没有自动同步。

公开根证书文件为 [public/local-rootCA.crt](public/local-rootCA.crt)，下载路径为 `/local-rootCA.crt`，本轮地址：

[https://192.168.4.102:33006/local-rootCA.crt](https://192.168.4.102:33006/local-rootCA.crt)

该文件对应本机 mkcert 的公开根证书，已纳入 Git；换机器或更换签发 CA 时应与实际服务证书对应。`public/` 文件随后续构建复制到 `dist/`；本轮也已复制到当时的 `dist/` 供现有预览服务下载。

- Android：将证书传到手机，进入“设置 → 安全与隐私 → 更多安全设置 → 加密与凭据 → 安装证书 → CA 证书”，选择文件并按系统提示安装；不同品牌可在设置中搜索“CA 证书”。
- iPhone：打开证书并安装描述文件，再进入“设置 → 通用 → 关于本机 → 证书信任设置”，开启对应 mkcert 根证书的完全信任。
- 首次手机尚未信任 CA 时，HTTPS 下载地址本身也可能出现证书警告，可先通过 USB 或文件传输取得证书。证书信任正常后，再通过支持的手机浏览器安装 PWA。
- 仅分发公开的 `.crt`/`rootCA.pem`；`rootCA-key.pem`、服务器私钥和整个 mkcert 目录保留在本机，不放入静态资源或 Git。

参考：[Android CA 安装](https://arubanetworking.hpe.com/techdocs/VIA/oxygen/VIA%20User%20Guide/GUID-562E6522-AFA7-41EC-8F16-D7792A935086.html)、[iPhone 证书信任](https://support.apple.com/en-us/102390)。实际手机安装与离线验收状态见项目当前快照。

## Android

Capacitor 配置与 `android/` 原生工程已生成。Android 构建使用 `capacitor` 模式，排除 PWA 插件与 Service Worker 注册控制器；Web 构建保留现有更新提示策略。

仅构建 Android Web 资源：

```powershell
pnpm build:android
```

一键生成可直接安装的 debug APK（Windows / PowerShell 7）：

每次执行前，先按[本地打包版本记录](CHANGELOG.md#打包流程)分配版本号并记录本次改动，执行后回填结果。

```powershell
pnpm apk
```

`pnpm apk → Android Web 构建 → cap sync android → Gradle assembleDebug → temp/app-debug.apk`

成功后自动创建项目根目录的 `temp/` 并覆盖其中的 `app-debug.apk`；该目录已加入 Git 忽略。Gradle 默认产物仍保留在 `android/app/build/outputs/apk/debug/`。打包结果及本次改动见[版本记录](CHANGELOG.md#历史记录)，真机运行尚未验证。

构建前需配置 JDK 21 的 `JAVA_HOME`；Android SDK 路径使用本机 `android/local.properties`。当前机器已安装的 JDK 可在终端中设置：

```powershell
$env:JAVA_HOME = 'D:\app_data\scoop\apps\temurin21-jdk\current'
```

两种构建均输出到 `dist/`，后执行的构建覆盖前一次产物；运行 PWA 预览前使用 `pnpm build` 或 `pnpm pwa`。

`android/` 是纳入 Git 的原生工程；构建产物和同步复制的 Web 资源由其 `.gitignore` 排除。工程约束与进度以项目开发文档为准。
