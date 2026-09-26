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
