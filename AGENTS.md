# AGENTS.md

## 项目概览

《未登录的人》是一个以深夜聊天为核心的视觉小说原型。当前版本只包含第一章（约 8–12 分钟）及三个结局。根目录的 Vite + React + TypeScript 实现是推荐的 Web 版本；`game/` 保留为 Ren'Py 原型与桌面发布路径。

## 目录职责

- `game/script.rpy`：章节流程、菜单、状态变量与结局。新剧情和分支放在这里或按章节新增 `.rpy` 文件。
- `src/App.tsx`：Web 第一章状态机、分支、结局和本地存档。React UI 使用 DOM/CSS，不使用 Canvas 或 WebAssembly。
- `src/styles.css`：Web UI 样式与 CSS 中文字体回退策略。
- `package.json`：Web 开发与构建命令。执行 `npm run build` 生成 `dist/`；不要提交 `node_modules/` 或 `dist/`。
- `game/screens.rpy`：聊天背景、好友申请、聊天窗口、对话框、选项和确认框等自定义 screen。
- `game/options.rpy`：游戏元数据、构建排除规则和全局样式。中文字体由这里的 `style default` 配置。
- `game/images/`：运行时图像。`bg/` 为背景，`avatars/` 为头像，`characters/` 为角色立绘。
- `game/fonts/`：随包发布的中文文本子集和许可证；不要删除 `OFL.txt`，也不要改用依赖本机的中文字体。
- `docs/`：叙事与资产的来源文档。改剧情前先读 `docs/story-bible.md` 和对应章节流程；改角色视觉资产前读 `docs/characters/` 中的角色母版。
- `README.md`：玩家/维护者的启动和 Web 发布说明。
- `progressive_download.txt`：Ren'Py Web 构建的渐进下载规则。

## Ren'Py 编写约定

- 使用四个空格缩进；保留 `.rpy` 文件的 UTF-8 中文文本。
- 可回滚、需存档的叙事状态用 `default` 声明，不要仅在 `init python` 中初始化。
- 玩家和 N 的实际发言必须通过 `me(...)`、`n(...)` 代理函数，不要直接调用 `me_character` 或 `n_character`；代理会同步更新 `chat_history`，供聊天背景显示。
- 新的角色发言如需进入聊天记录，应仿照现有代理函数实现，并在 `screens.rpy` 中处理其消息样式。
- 新增 screen 时明确设置合适的 `zorder`，避免盖住 `say`（200）、`choice`（250）或确认框（500）。自定义 `say`、`choice` screen 必须继续接受 Ren'Py 传入的同名参数。
- `chat_history` 只展示最后四条消息。若调整记录格式或数量，同时修改 `script.rpy` 的写入逻辑和 `screens.rpy` 的渲染逻辑。
- 结局跳转的优先级为：信任最高优先，其次好奇，最后回避。变更倾向数值或条件时，更新 `docs/chapter-01-flow.md`，并手动覆盖三条结局路径。

## 叙事与内容边界

- N 要自然、略带调侃，异常由日常通信细节和界面失真呈现；不要把她写成高冷谜语人，也不要在第一章解释真实身份。
- 主角以“我”呈现，不固定外貌或姓名；通过日常行为体现性格，而不是直接宣告情绪或设定。
- 不使用任何参考作品的人物、专有设定、情节、原文台词或美术标识。详见 `docs/story-bible.md`。
- 角色立绘以 `master_front.jpg` 为锁定母版。新增 N 的图像须保持发色层次、服装、比例和克制表情；男主不使用 N 的红色识别色。
- 第一章不提前展示 N 的真人脸，也不为未进入剧情的素材增加运行时引用。

## 资产与界面

- 添加图像后使用相对 `game/` 的 Ren'Py 路径，例如 `images/bg/example.png`；提交必要的源文件，不提交生成缓存。
- Ren'Py Web 不能可靠地使用访问者的系统字体。`UnloggedText.woff2` 是当前 `.rpy` 文本的中文子集；改动任何游戏文案后，用 `docs/font-source/NotoSansCJKsc-Regular.otf` 和 FontTools 从全部 `.rpy` 重新生成并确认没有缺字，再提交该文件。`docs/` 会被构建规则排除，不会增加发行包体积。
- 背景图由 `chat_backdrop` 按 `config.screen_width` 和 `config.screen_height` 拉伸。替换时在目标分辨率下检查裁切和文字可读性。
- 保持现有冷色界面与少量红色警示色的视觉语言。文本须在深色背景上有足够对比度。
- 聊天气泡中的动态文本保留 `substitute False`，避免玩家输入或文本意外触发替换。

## 验证与发布

1. 用 Ren'Py Launcher 打开本仓库的父目录并启动项目，确认脚本能编译且可进入第一章。
2. 修改剧情、变量或 screen 后，从新游戏分别走到 `明天见`、`23:47`、`她从未存在` 三个结局；检查好友申请、聊天窗口、菜单与结束画面不会叠层残留。
3. 修改字体、图像或 Web 规则后，在 Launcher 的 **Web (Beta)** 执行 **Build and Open in Browser**，检查中文字体、图片加载与初次下载行为。第一章首屏背景和头像必须保留为 `progressive_download.txt` 中的 `- image` 条目；后续章节资源使用 `+ image` 按需下载。
4. Web 发布时，将最新构建目录的全部内容发布到 `gh-pages` 分支根目录；不要发布单独的 `web.zip`。

本仓库未固定 Ren'Py 可执行文件路径，也没有 CI。若本机未安装 Ren'Py，明确说明未运行的验证项，不要把 `.rpyc`、`game/cache/`、`game/saves/`、构建目录或构建 zip 提交到 Git。

## 变更收尾

- 剧情结构或角色规则变动时，同步更新相关 `docs/` 文档和 README 中过时的项目名称/路径。
- 运行 `git status --short`，确认只包含预期改动。
- 提交信息用简短、祈使式英文，例如 `feat: add chapter two branch` 或 `fix: preserve chat history`。
