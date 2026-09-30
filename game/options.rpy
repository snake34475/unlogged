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

# 原型优先保证 Windows 上的中文可读。正式发布时将替换为随游戏分发的开源字体。
style default:
    font "C:/Windows/Fonts/msyh.ttc"

