import { useEffect, useMemo, useState } from "react";
import backgroundUrl from "../game/images/bg/room_night.jpg";
import nAvatarUrl from "../game/images/avatars/n_unknown.jpg";
import playerAvatarUrl from "../game/images/avatars/player_unknown.jpg";

type Sender = "n" | "me" | "narrator" | "system";
type Phase = "opening" | "request" | "sleep" | "white-coat" | "reply" | "ended";

type Line = { sender: Sender; text: string };
type Scores = { trust: number; curiosity: number; avoidance: number };
type GameState = { phase: Phase; history: Line[]; scores: Scores; ending?: string };

const SAVE_KEY = "unlogged.chapter-01.save";

const opening: Line[] = [
  { sender: "narrator", text: "23:47。" },
  { sender: "narrator", text: "明天早上七点二十到校。" },
  { sender: "narrator", text: "如果现在睡觉，还能睡七个小时。" },
  { sender: "narrator", text: "如果打一局游戏，大概只能睡六个小时。" },
  { sender: "narrator", text: "所以问题来了。我为什么还没有开始打游戏？" },
];

const initialState = (): GameState => ({
  phase: "opening",
  history: opening,
  scores: { trust: 0, curiosity: 0, avoidance: 0 },
});

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return initialState();
    const state = JSON.parse(saved) as GameState;
    if (!state.phase || !Array.isArray(state.history) || !state.scores) return initialState();
    return state;
  } catch {
    return initialState();
  }
}

function append(state: GameState, lines: Line[], phase: Phase, scores = state.scores): GameState {
  return { ...state, phase, scores, history: [...state.history, ...lines] };
}

const bubbleLabel: Record<Sender, string> = { n: "N", me: "我", narrator: "", system: "" };

export default function App() {
  const [game, setGame] = useState<GameState>(loadState);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  const visibleHistory = useMemo(() => game.history.slice(-8), [game.history]);

  const chooseOpening = (text: string) => {
    const outcomes: Record<string, Line[]> = {
      "打一局再说。": [
        { sender: "narrator", text: "游戏启动。" },
        { sender: "narrator", text: "三分钟后，我关掉了它。今天什么都不想玩。" },
      ],
      "还是早点睡吧。": [
        { sender: "narrator", text: "我合上电脑。两秒后，又把它打开了。" },
      ],
      "先看看 QQ。": [
        { sender: "narrator", text: "在线 7 人。其中有一个灰色头像，我已经看了五分钟。" },
      ],
    };
    setGame((state) => append(state, [...outcomes[text], { sender: "system", text: "一个陌生账号请求添加你为好友。" }], "request"));
  };

  const chooseRequest = (choice: "agree" | "decline" | "profile") => {
    const configs = {
      agree: {
        delta: { trust: 1, curiosity: 0, avoidance: 0 },
        lines: [{ sender: "n", text: "晚上好。" }, { sender: "me", text: "你谁？" }, { sender: "n", text: "这么直接？那现在认识了。" }],
      },
      decline: {
        delta: { trust: 0, curiosity: 0, avoidance: 1 },
        lines: [{ sender: "system", text: "好友请求已拒绝。两秒后，账号 N 再次请求添加你为好友。" }, { sender: "n", text: "你点拒绝的时候，动作倒是挺快。" }, { sender: "me", text: "你怎么能发消息？" }, { sender: "n", text: "现在同意我，就能慢慢解释。" }],
      },
      profile: {
        delta: { trust: 0, curiosity: 1, avoidance: 0 },
        lines: [{ sender: "system", text: "资料页是空的：没有地区、没有签名，注册日期显示为 --。" }, { sender: "n", text: "看完了吗？" }, { sender: "me", text: "你资料怎么是空的？" }, { sender: "n", text: "因为没有什么值得写。" }],
      },
    } as const;
    const selected = configs[choice];
    setGame((state) => {
      const scores = {
        trust: state.scores.trust + selected.delta.trust,
        curiosity: state.scores.curiosity + selected.delta.curiosity,
        avoidance: state.scores.avoidance + selected.delta.avoidance,
      };
      return append(state, [...selected.lines, { sender: "n", text: "你准备睡了？" }, { sender: "me", text: "嗯。" }, { sender: "n", text: "骗人。你刚才打开游戏了。" }], "sleep", scores);
    });
  };

  const chooseSleep = (choice: "know" | "monitor" | "guess") => {
    const configs = {
      know: { delta: { trust: 0, curiosity: 2, avoidance: 0 }, lines: [{ sender: "me", text: "你认识我？" }, { sender: "n", text: "今天见过。" }, { sender: "me", text: "在哪？" }, { sender: "n", text: "你们学校。" }] },
      monitor: { delta: { trust: 1, curiosity: 0, avoidance: 0 }, lines: [{ sender: "me", text: "你在我电脑里装监控？" }, { sender: "n", text: "太麻烦了。我只是看见了。" }, { sender: "me", text: "这句话一点也不像玩笑。" }] },
      guess: { delta: { trust: 0, curiosity: 0, avoidance: 2 }, lines: [{ sender: "me", text: "猜的吧。" }, { sender: "n", text: "嗯。你也可以一直这么想。" }] },
    } as const;
    const selected = configs[choice];
    setGame((state) => append(state, [...selected.lines, { sender: "n", text: "今天穿白色外套的那个女孩，没有上线。" }, { sender: "narrator", text: "我坐直了一点。她甚至没有说名字。" }], "white-coat", { trust: state.scores.trust + selected.delta.trust, curiosity: state.scores.curiosity + selected.delta.curiosity, avoidance: state.scores.avoidance + selected.delta.avoidance }));
  };

  const chooseWhiteCoat = (choice: "purpose" | "how" | "silent") => {
    const configs = {
      purpose: { delta: { trust: 2, curiosity: 0, avoidance: 0 }, lines: [{ sender: "me", text: "你到底想做什么？" }, { sender: "n", text: "确认你会不会回我。" }, { sender: "me", text: "现在确认完了吗？" }, { sender: "n", text: "还差一点。" }] },
      how: { delta: { trust: 0, curiosity: 2, avoidance: 0 }, lines: [{ sender: "me", text: "你怎么知道她？" }, { sender: "n", text: "因为你看她的时候，和看其他人不一样。" }, { sender: "me", text: "你在学校盯着我？" }, { sender: "n", text: "你终于问了一个接近的问题。" }] },
      silent: { delta: { trust: 0, curiosity: 0, avoidance: 2 }, lines: [{ sender: "narrator", text: "我没有回复。聊天框上方出现了：N 正在输入。" }, { sender: "n", text: "不回复也算一种回答。" }] },
    } as const;
    const selected = configs[choice];
    setGame((state) => append(state, [...selected.lines, { sender: "n", text: "你刚才是不是把游戏关了？" }, { sender: "me", text: "你怎么知道？" }, { sender: "n", text: "因为我就在你旁边。" }, { sender: "narrator", text: "我回头。房间里只有电脑风扇在响。" }, { sender: "n", text: "别回头。你会错过消息。" }, { sender: "system", text: "右上角的时间仍然是 23:47。" }], "reply", { trust: state.scores.trust + selected.delta.trust, curiosity: state.scores.curiosity + selected.delta.curiosity, avoidance: state.scores.avoidance + selected.delta.avoidance }));
  };

  const finish = () => setGame((state) => {
    const { trust, curiosity, avoidance } = state.scores;
    if (trust >= curiosity && trust >= avoidance) return { ...append(state, [{ sender: "me", text: "明天见一面。你敢吗？" }, { sender: "n", text: "好啊。放学以后，去操场。" }, { sender: "n", text: "到时候你就知道了。" }, { sender: "system", text: "N 已离线。她的头像灰下去前，我好像看见状态栏写着：从未登录。" }], "ended"), ending: "END 01 · 明天见" };
    if (curiosity >= avoidance) return { ...append(state, [{ sender: "me", text: "你到底是谁？" }, { sender: "n", text: "一个不应该在今晚联系你的人。" }, { sender: "system", text: "网络连接中断。电脑桌面上的时间是 23:47。滴。账号 N 请求添加你为好友。" }], "ended"), ending: "END 02 · 23:47" };
    return { ...append(state, [{ sender: "me", text: "我不想玩了。" }, { sender: "n", text: "好。晚安。" }, { sender: "system", text: "我关闭窗口，再打开好友列表。没有 N。未知号码：你刚才为什么不相信我？" }], "ended"), ending: "END 03 · 她从未存在" };
  });

  const choices = (() => {
    switch (game.phase) {
      case "opening": return [{ label: "打一局再说。", onClick: () => chooseOpening("打一局再说。") }, { label: "还是早点睡吧。", onClick: () => chooseOpening("还是早点睡吧。") }, { label: "先看看 QQ。", onClick: () => chooseOpening("先看看 QQ。") }];
      case "sleep": return [{ label: "你认识我？", onClick: () => chooseSleep("know") }, { label: "你在我电脑里装监控？", onClick: () => chooseSleep("monitor") }, { label: "猜的吧。", onClick: () => chooseSleep("guess") }];
      case "white-coat": return [{ label: "你到底想做什么？", onClick: () => chooseWhiteCoat("purpose") }, { label: "你怎么知道她？", onClick: () => chooseWhiteCoat("how") }, { label: "不回复。", onClick: () => chooseWhiteCoat("silent") }];
      case "reply": return [{ label: "发送最后一条消息", onClick: finish }];
      default: return [];
    }
  })();

  return <main className="game-shell" style={{ backgroundImage: `linear-gradient(#070b1299, #070b12d9), url(${backgroundUrl})` }}>
    <section className="game" aria-label="未登录的人，第一章">
      <header><div><p>第一章</p><h1>未登录的人</h1></div><button className="reset" onClick={() => setGame(initialState())}>重新开始</button></header>
      <div className="clock">23:47</div>
      <section className="chat-window">
        <div className="chat-heading"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>{game.phase === "opening" || game.phase === "request" ? "等待回应" : "在线"}</span></div></div>
        <div className="messages" aria-live="polite">{visibleHistory.map((line, index) => <Message key={`${line.text}-${index}`} line={line} />)}</div>
      </section>
      {game.phase === "request" && <section className="request"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>请求添加你为好友</span><small>刚刚</small></div><div className="request-actions"><button onClick={() => chooseRequest("agree")}>同意</button><button onClick={() => chooseRequest("decline")}>拒绝</button><button onClick={() => chooseRequest("profile")}>查看资料</button></div></section>}
      {game.phase !== "request" && game.phase !== "ended" && <section className="choices"><span>你准备：</span>{choices.map((choice) => <button key={choice.label} onClick={choice.onClick}>{choice.label}</button>)}</section>}
      {game.phase === "ended" && <section className="ending"><p>章节结束</p><h2>{game.ending}</h2><button onClick={() => setGame(initialState())}>从头开始</button></section>}
    </section>
  </main>;
}

function Message({ line }: { line: Line }) {
  if (line.sender === "narrator" || line.sender === "system") return <p className={`notice ${line.sender}`}>{line.text}</p>;
  const isN = line.sender === "n";
  return <div className={`message ${isN ? "from-n" : "from-me"}`}><img src={isN ? nAvatarUrl : playerAvatarUrl} alt="" /><div><small>{bubbleLabel[line.sender]}</small><p>{line.text}</p></div></div>;
}
