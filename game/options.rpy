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

# Ren'Py Web 不能像 CSS font-family 一样可靠地访问访问者的系统字体。
# 此 WOFF2 是从游戏当前文本生成的 Noto Sans CJK SC 子集，既保证中文可读，
# 又避免在首屏下载完整的 16 MB 字体。新增或修改文案后须重新生成该子集。
style default:
    font "fonts/UnloggedText.woff2"
