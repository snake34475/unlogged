# Cover the three chapter endings while voice statements are active.
testsuite chapter_one_voice_routes:
    before testcase:
        run Jump("start")
        advance until screen "choice"
        click "打一局再说。"
        advance until screen "choice"

    testcase tomorrow:
        click "同意。"
        advance until "晚上好。"
        assert eval renpy.music.get_playing(channel="voice") == "voice/chapter01/friend-agree-0.mp3"
        advance until screen "choice"
        click "你在我电脑里装监控？"
        advance until screen "choice"
        click "你到底想做什么？"
        advance until "END 01\n\n明天见"
        assert eval renpy.get_screen("friend_request") is None
        assert eval renpy.get_screen("n_chat_window") is None

    testcase loop:
        click "先看一下资料。"
        advance until screen "choice"
        click "你认识我？"
        advance until screen "choice"
        click "你怎么知道她？"
        advance until "END 02\n\n23:47"
        assert eval renpy.get_screen("friend_request") is None
        assert eval renpy.get_screen("n_chat_window") is None

    testcase absent:
        click "拒绝。"
        advance until screen "choice"
        click "猜的吧。"
        advance until screen "choice"
        click "不回复。"
        advance until "END 03\n\n她从未存在"
        assert eval renpy.get_screen("friend_request") is None
        assert eval renpy.get_screen("n_chat_window") is None

    teardown:
        exit
