# 聊天软件只是场景背景；剧情文字由 Ren'Py 原生对话框逐句呈现。
screen chat_backdrop():
    zorder -100

    # 按游戏实际分辨率缩放，避免只显示原图左上角。
    add "images/bg/room_night.jpg" xsize config.screen_width ysize config.screen_height

# 只在 N 首次出现时短暂使用；不是常驻聊天软件界面。
screen friend_request():
    zorder 150

    frame:
        xalign 0.84
        yalign 0.16
        xsize int(config.screen_width * 0.30)
        background "#101827f4"
        padding (16, 14)

        hbox:
            spacing 14
            add "images/avatars/n_unknown.jpg" xsize 78 ysize 78
            vbox:
                spacing 4
                text "N" size 27 color "#f2f4f8"
                text "请求添加你为好友" size 18 color "#b5c0d0"
                text "刚刚" size 15 color "#7d8aa0"

# 好友申请处理后才出现的聊天窗口。消息正文仍由底部对话框承载。
screen n_chat_window():
    zorder -50

    frame:
        xalign 0.5
        yalign 0.36
        xsize int(config.screen_width * 0.74)
        ysize int(config.screen_height * 0.55)
        background "#101827db"
        padding (0, 0)

        vbox:
            frame:
                xfill True
                ysize 96
                background "#19243a"
                padding (20, 14)
                hbox:
                    spacing 14
                    add "images/avatars/n_unknown.jpg" xsize 64 ysize 64
                    vbox:
                        text "N" size 28 color "#f2f4f8"
                        text "在线" size 16 color "#8fc5ad"

            fixed:
                xfill True
                yfill True
                vbox:
                    xalign 0.5
                    yalign 0.5
                    xsize int(config.screen_width * 0.66)
                    spacing 10
                    text "23:47" xalign 0.5 size 16 color "#607088"
                    null height 2
                    for kind, message in chat_history[-4:]:
                        if kind == 1:
                            hbox:
                                xalign 0.0
                                spacing 9
                                add "images/avatars/n_unknown.jpg" xsize 38 ysize 38
                                frame:
                                    xmaximum int(config.screen_width * 0.41)
                                    background "#2a364b"
                                    padding (14, 9)
                                    text message substitute False size 20 color "#f4f6fa"
                        else:
                            hbox:
                                xalign 1.0
                                spacing 9
                                frame:
                                    xmaximum int(config.screen_width * 0.41)
                                    background "#365d85"
                                    padding (14, 9)
                                    text message substitute False size 20 color "#f4f6fa" xalign 1.0
                                add "images/avatars/player_unknown.jpg" xsize 38 ysize 38


# 这个项目从空目录搭建，因此明确提供原生叙事用的底部对话框。
screen say(who, what):
    zorder 200

    frame:
        xalign 0.5
        yalign 0.94
        xsize int(config.screen_width * 0.88)
        yminimum int(config.screen_height * 0.19)
        background "#0b101ae8"
        padding (32, 22)

        vbox:
            spacing 8
            if who:
                text who id "who" size 24 color "#e8758a"
            text what id "what" size 29 color "#f4f6fa" line_spacing 6

# 与 Ren'Py menu 语句配套的选项面板。
screen choice(items):
    zorder 250
    modal True

    frame:
        xalign 0.5
        # 菜单接替底部对话框的位置，保持阅读与作答的视觉节奏。
        yalign 0.91
        xsize int(config.screen_width * 0.88)
        background "#131b29f2"
        padding (22, 18)

        vbox:
            spacing 10
            text "你准备：" size 19 color "#aeb9ca"
            for item in items:
                if item.action:
                    textbutton item.caption:
                        xfill True
                        text_size 25
                        text_color "#f5f7fb"
                        background "#2f4c6b"
                        hover_background "#a94b62"
                        padding (18, 12)
                        action item.action

# Ren'Py 在关闭窗口、返回标题等操作时会调用此确认框。
screen yesno_prompt(message, yes_action, no_action):
    modal True
    zorder 500

    frame:
        xalign 0.5
        yalign 0.5
        xsize int(config.screen_width * 0.52)
        background "#101827fa"
        padding (30, 26)

        vbox:
            spacing 22
            text message xalign 0.5 text_align 0.5 size 28 color "#f4f6fa"
            hbox:
                xalign 0.5
                spacing 16
                textbutton "确定":
                    text_size 22
                    text_color "#f4f6fa"
                    background "#a94b62"
                    hover_background "#d85d77"
                    padding (28, 12)
                    action yes_action
                textbutton "取消":
                    text_size 22
                    text_color "#f4f6fa"
                    background "#304b69"
                    hover_background "#466887"
                    padding (28, 12)
                    action no_action
