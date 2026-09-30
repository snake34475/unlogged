# 《未登录的人》

一个原创的现代都市异闻聊天互动原型。玩家在深夜收到陌生账号 **N** 的好友请求；对方看似随意，却不断说中不该知道的细节。

## 当前内容

- 第一章完整可玩流程（约 8–12 分钟）
- 自绘聊天窗口，无需外部美术即可启动
- 三项隐藏倾向：信任、好奇、回避
- 三个结局：`明天见`、`23:47`、`她从未存在`

## 运行

### 纯 Web 版（推荐）

第一章已迁移为 Vite + React + TypeScript 的静态网页实现；它不加载 Ren'Py 的 WebAssembly 运行时，适合 GitHub Pages 和移动浏览器。

```bash
npm install
npm run dev
```

执行 `npm run build` 会生成可部署的 `dist/` 目录。该版本会自动将当前章节进度、聊天记录和隐藏倾向保存在浏览器本地；点击“重新开始”即可清除并开始新周目。

### Ren'Py 原型

1. 安装 [Ren'Py](https://www.renpy.org/)。
2. 在 Launcher 的偏好设置中，将“Projects Directory / 项目目录”设为 `C:\Users\10988\Desktop\coding\ai-game`（即 `longzu` 的上一层目录）。
3. 点击“Refresh / 刷新”或重启 Launcher；它会自动扫描并显示 `longzu`。
4. 选中 `longzu` 后点击“Launch Project / 启动项目”。

如果你的版本没有项目目录设置入口，可先点击“创建新项目”，在首次出现的“项目目录”选择框中选择 `C:\Users\10988\Desktop\coding\ai-game`；创建完成后刷新 Launcher，`longzu` 也会出现在项目列表中。临时创建的空项目随后可在资源管理器中删除。

项目目前使用纯色 UI 和文字音效占位。中文文本使用随项目分发的 Noto Sans CJK SC 文本子集（`game/fonts/UnloggedText.woff2`），因此 Windows 与 Web 构建均不依赖系统字体；其许可证位于 `game/fonts/OFL.txt`。子集只覆盖当前游戏文案，新增或修改文本后须重新生成。以后可以直接替换 `game/` 内的界面与音频实现。

## 发布到 GitHub Pages

1. 在 Ren'Py Launcher 的 **Web (Beta)** 页面执行 **Build Web Application**，并先用 **Build and Open in Browser** 本地验证。
2. 将生成的 Web 目录中的所有文件发布到仓库的 `gh-pages` 分支根目录；不要只上传 `web.zip`。其中 `index.html`、`game/`、`game.zip`、`renpy.data`、`renpy.js` 和 `renpy.wasm` 都是必需文件。
3. 在 GitHub 仓库的 **Settings → Pages** 中，选择 **Deploy from a branch**，并将 `gh-pages` 的 `/(root)` 设为发布来源。

本项目采用本机构建、`gh-pages` 分支发布的方式，因而无需 GitHub Actions 工作流。每次发布都应以最新 Web 构建目录的内容完整替换 `gh-pages` 分支的内容。首次加载会下载 Ren'Py Web 运行时、游戏资源与中文字体，耗时取决于网络状况。

## 文档

- `docs/story-bible.md`：叙事规则、角色边界与原创原则
- `docs/chapter-01-flow.md`：第一章分支结构
- `docs/asset-list.md`：后续素材清单
