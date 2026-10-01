# 第一章《未登录的人》
# 叙事文字使用默认对话框逐句推进；聊天应用只作为背景。

default trust = 0
default curiosity = 0
default avoidance = 0
default chat_history = []

# 用代理角色确保每句实际发言必定写入背景聊天记录。
define n_character = Character("N", color="#e8758a", voice_tag="n")
define me_character = Character("我", color="#9fd2ff", voice_tag="me")
image chapter_base = Solid("#070b12")

init python:
    def n(what, **kwargs):
        store.chat_history.append((1, what))
        n_character(what, **kwargs)

    def me(what, **kwargs):
        store.chat_history.append((2, what))
        me_character(what, **kwargs)

label start:
    $ trust = 0
    $ curiosity = 0
    $ avoidance = 0
    $ chat_history = []
    scene chapter_base
    show screen chat_backdrop

    "23:47。"
    "明天早上七点二十到校。"
    "如果现在睡觉，还能睡七个小时。"
    "如果打一局游戏，大概只能睡六个小时。"
    "所以问题来了。"
    "我为什么还没有开始打游戏？"

    menu:
        "打一局再说。":
            "游戏启动。"
            "三分钟后，我关掉了它。"
            "今天什么都不想玩。"
        "还是早点睡吧。":
            "我合上电脑。"
            "两秒后，又把它打开了。"
        "先看看 QQ。":
            "在线 7 人。"
            "其中有一个灰色头像，我已经看了五分钟。"

    show screen friend_request
    "滴。"
    "一个陌生账号请求添加你为好友。"

    menu:
        "同意。":
            $ trust += 1
            hide screen friend_request
            show screen n_chat_window
            voice "voice/chapter01/friend-agree-0.mp3"
            n "晚上好。"
            voice "voice/chapter01/friend-agree-1.mp3"
            me "你谁？"
            voice "voice/chapter01/friend-agree-2.mp3"
            n "这么直接？那现在认识了。"
        "拒绝。":
            $ avoidance += 1
            hide screen friend_request
            show screen n_chat_window
            "好友请求已拒绝。"
            "两秒后，账号 N 再次请求添加你为好友。"
            voice "voice/chapter01/friend-decline-2.mp3"
            n "你点拒绝的时候，动作倒是挺快。"
            voice "voice/chapter01/friend-decline-3.mp3"
            me "你怎么能发消息？"
            voice "voice/chapter01/friend-decline-4.mp3"
            n "现在同意我，就能慢慢解释。"
        "先看一下资料。":
            $ curiosity += 1
            hide screen friend_request
            show screen n_chat_window
            "资料页是空的。"
            "没有地区，没有签名，注册日期显示为 --。"
            voice "voice/chapter01/friend-profile-2.mp3"
            n "看完了吗？"
            voice "voice/chapter01/friend-profile-3.mp3"
            me "你资料怎么是空的？"
            voice "voice/chapter01/friend-profile-4.mp3"
            n "因为没有什么值得写。"

    voice "voice/chapter01/sleep-0.mp3"
    n "你准备睡了？"
    voice "voice/chapter01/sleep-1.mp3"
    me "嗯。"
    voice "voice/chapter01/sleep-2.mp3"
    n "骗人。"
    voice "voice/chapter01/sleep-3.mp3"
    n "你刚才打开游戏了。"

    menu:
        "你认识我？":
            $ curiosity += 2
            voice "voice/chapter01/sleep-know-0.mp3"
            me "你认识我？"
            voice "voice/chapter01/sleep-know-1.mp3"
            n "今天见过。"
            voice "voice/chapter01/sleep-know-2.mp3"
            me "在哪？"
            voice "voice/chapter01/sleep-know-3.mp3"
            n "你们学校。"
        "你在我电脑里装监控？":
            $ trust += 1
            voice "voice/chapter01/sleep-monitor-0.mp3"
            me "你在我电脑里装监控？"
            voice "voice/chapter01/sleep-monitor-1.mp3"
            n "太麻烦了。"
            voice "voice/chapter01/sleep-monitor-2.mp3"
            n "我只是看见了。"
            voice "voice/chapter01/sleep-monitor-3.mp3"
            me "这句话一点也不像玩笑。"
        "猜的吧。":
            $ avoidance += 2
            voice "voice/chapter01/sleep-guess-0.mp3"
            me "猜的吧。"
            voice "voice/chapter01/sleep-guess-1.mp3"
            n "嗯。"
            voice "voice/chapter01/sleep-guess-2.mp3"
            n "你也可以一直这么想。"

    voice "voice/chapter01/white-coat-0.mp3"
    n "今天穿白色外套的那个女孩，没有上线。"
    "我坐直了一点。"
    "她甚至没有说名字。"

    menu:
        "你到底想做什么？":
            $ trust += 2
            voice "voice/chapter01/white-purpose-0.mp3"
            me "你到底想做什么？"
            voice "voice/chapter01/white-purpose-1.mp3"
            n "确认你会不会回我。"
            voice "voice/chapter01/white-purpose-2.mp3"
            me "现在确认完了吗？"
            voice "voice/chapter01/white-purpose-3.mp3"
            n "还差一点。"
        "你怎么知道她？":
            $ curiosity += 2
            voice "voice/chapter01/white-how-0.mp3"
            me "你怎么知道她？"
            voice "voice/chapter01/white-how-1.mp3"
            n "因为你看她的时候，和看其他人不一样。"
            voice "voice/chapter01/white-how-2.mp3"
            me "你在学校盯着我？"
            voice "voice/chapter01/white-how-3.mp3"
            n "你终于问了一个接近的问题。"
        "不回复。":
            $ avoidance += 2
            "我没有回复。"
            "聊天框上方出现了：N 正在输入。"
            "一分钟过去，输入状态没有消失。"
            voice "voice/chapter01/white-silent-3.mp3"
            n "不回复也算一种回答。"

    voice "voice/chapter01/final-0.mp3"
    n "你刚才是不是把游戏关了？"
    voice "voice/chapter01/final-1.mp3"
    me "你怎么知道？"
    voice "voice/chapter01/final-2.mp3"
    n "因为我就在你旁边。"
    "我回头。"
    "房间里只有电脑风扇在响。"
    voice "voice/chapter01/final-5.mp3"
    n "别回头。"
    voice "voice/chapter01/final-6.mp3"
    n "你会错过消息。"
    "右上角的时间仍然是 23:47。"

    if trust >= curiosity and trust >= avoidance:
        jump ending_tomorrow
    elif curiosity >= avoidance:
        jump ending_loop
    else:
        jump ending_absent

label ending_tomorrow:
    voice "voice/chapter01/ending-tomorrow-0.mp3"
    me "明天见一面。你敢吗？"
    voice "voice/chapter01/ending-tomorrow-1.mp3"
    n "好啊。"
    voice "voice/chapter01/ending-tomorrow-2.mp3"
    n "放学以后，去操场。"
    voice "voice/chapter01/ending-tomorrow-3.mp3"
    me "找你？"
    voice "voice/chapter01/ending-tomorrow-4.mp3"
    n "找一个人。"
    voice "voice/chapter01/ending-tomorrow-5.mp3"
    n "到时候你就知道了。"
    "N 已离线。"
    "她的头像灰下去前，我好像看见状态栏写着：从未登录。"
    hide screen chat_backdrop
    hide screen n_chat_window
    scene chapter_base
    centered "END 01\n\n明天见"
    return

label ending_loop:
    voice "voice/chapter01/ending-loop-0.mp3"
    me "你到底是谁？"
    voice "voice/chapter01/ending-loop-1.mp3"
    n "一个不应该在今晚联系你的人。"
    "网络连接中断。"
    "聊天窗口关闭。"
    "电脑桌面上的时间是 23:47。"
    "滴。"
    "账号 N 请求添加你为好友。"
    hide screen chat_backdrop
    hide screen n_chat_window
    scene chapter_base
    centered "END 02\n\n23:47"
    return

label ending_absent:
    voice "voice/chapter01/ending-absent-0.mp3"
    me "我不想玩了。"
    voice "voice/chapter01/ending-absent-1.mp3"
    n "好。晚安。"
    "我关闭窗口，再打开好友列表。"
    "没有 N。"
    "没有好友申请。"
    "没有新的聊天记录。"
    "手机震了一下。"
    "未知号码：你刚才为什么不相信我？"
    hide screen chat_backdrop
    hide screen n_chat_window
    scene chapter_base
    centered "END 03\n\n她从未存在"
    return
