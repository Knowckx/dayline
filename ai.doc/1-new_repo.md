# 快速初始化新项目

#### 克隆模板
把 dayline 这个仓库当模板, 且不带原仓库的 Git 历史
```bash
pnpm dlx degit Knowckx/dayline yourAppName
```


#### 初始化模板
2. 上层的 pnpm-workspace.yaml 加上新项目
3. pnpm install
4. 改一下端口 `vite.config.ts`  preview.port

#### git

```bash
# 初始化新的 git 仓库
git init
git add .
git commit -m "Initial commit from template"
# 然后 点击vscode的发布按钮 可以直接推私人库
```

# 启动

```bash
pnpm dev

# 预览生产构建
pnpm pwa
```
