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

### 制作角色语音

Web 版支持为“我”和 N 的台词附加离线语音。没有语音素材时，游戏仍按原样运行。生成素材前，在仓库根目录创建不会提交的 `.env.local`：

```text
MIMO_API_KEY=你的MiMo密钥
```

先用 `npm run voice:generate -- --list` 查看台词 ID，再用 `npm run voice:generate -- --id=friend-agree-0` 试听单句；满意后执行 `npm run voice:generate` 补齐。脚本调用 MiMo V2.5 的文字设计音色接口，依照 `src/story/chapter01.ts` 的节点 ID 将 MP3 写入 `public/voice/chapter01/`，并更新 `src/voice/manifest.json`。已有且台词未变的文件会跳过；`--force` 可重生成。提交前逐句听检角色音色、读音及情绪。浏览器内的角色台词会在逐字显示时自动播放语音，设置中可以关闭；也可按句手动重播。浏览器首次载入存档时可能拦截未经点击的自动播放，此时点一次“点击启用语音”即可继续。API Key 仅用于本地生成，不进入网页构建。

语音审核通过后运行 `npm run voice:sync-renpy`，脚本会核对 Ren'Py 与 Web 的 49 句角色台词，复制音频到 `game/voice/chapter01/`，并在相应的 `n`、`me` 发言前写入 `voice` 语句。两版台词不一致或音频缺失时同步会报错，避免配错声音。Ren'Py 语音使用游戏内的 Voice Volume 控制；Ren'Py Web 构建会按 `progressive_download.txt` 中的 `+ voice` 规则按需下载。

### Ren'Py 原型

1. 安装 [Ren'Py](https://www.renpy.org/)。
2. 在 Launcher 的偏好设置中，将“Projects Directory / 项目目录”设为本仓库的父目录。
3. 点击“Refresh / 刷新”或重启 Launcher；它会自动扫描并显示 `unlogged`。
4. 选中 `unlogged` 后点击“Launch Project / 启动项目”。

如果你的版本没有项目目录设置入口，可先点击“创建新项目”，在首次出现的“项目目录”选择框中选择本仓库的父目录；创建完成后刷新 Launcher，`unlogged` 也会出现在项目列表中。

项目目前使用纯色 UI 和文字音效占位。中文文本使用随项目分发的 Noto Sans CJK SC 文本子集（`game/fonts/UnloggedText.woff2`），因此 Windows 与 Web 构建均不依赖系统字体；其许可证位于 `game/fonts/OFL.txt`。子集只覆盖当前游戏文案，新增或修改文本后须重新生成。以后可以直接替换 `game/` 内的界面与音频实现。

## 发布到 GitHub Pages

推荐的 Web 版是 Vite 静态网站。执行 `npm run build` 后，将 `dist/` **目录中的全部内容**发布到仓库 `gh-pages` 分支根目录，包括 `index.html`、`assets/` 和 `voice/`。不要把 `dist/` 目录本身作为网站子目录；语音文件必须随页面一同上传。

在 GitHub 仓库的 **Settings → Pages** 中选择 **Deploy from a branch**，并将 `gh-pages` 的 `/(root)` 设为发布来源。每次发布时用最新构建完整替换该分支根目录；`.nojekyll` 应保留在根目录。网站资源使用相对路径，适用于仓库的 GitHub Pages 子路径。

Ren'Py Web 是单独的构建与发布路径；如果要发布它，应在 Ren'Py Launcher 的 **Web (Beta)** 中先执行 **Build and Open in Browser**，再将其完整构建目录发布到目标位置，不要只上传 `web.zip`。

## 文档

- `docs/story-bible.md`：叙事规则、角色边界与原创原则
- `docs/chapter-01-flow.md`：第一章分支结构
- `docs/asset-list.md`：后续素材清单
