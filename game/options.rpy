define config.name = "未登录的人"
define gui.show_name = True
define config.version = "0.1.0"
define build.name = "unlogged"
define build.version = "0.1.0"

init python:
    # 参考材料与开发文档不进入可发布的游戏包。
    build.classify("龙族1~4 (江南) (z-library.sk, 1lib.sk, z-lib.sk).txt", None)
    build.classify("gpt-talk.txt", None)
    build.classify("docs/**", None)
    build.classify("README.md", None)

# 使用随游戏分发的开源中文字体，确保 Web/WASM 运行时也能读取。
style default:
    font "fonts/NotoSansCJKsc-Regular.otf"

