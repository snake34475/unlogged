import { useEffect, useState } from "react";
import backgroundUrl from "../game/images/bg/room_night.jpg";
import nAvatarUrl from "../game/images/avatars/n_unknown.jpg";
import playerAvatarUrl from "../game/images/avatars/player_unknown.jpg";
import { chapter01Start, getNode, type Scores, type Sender } from "./story/chapter01";

type ChatLine = { sender: "n" | "me"; text: string };
type GameState = { version: 2; currentId: string; scores: Scores; chatHistory: ChatLine[]; chatVisible: boolean };

const SAVE_KEY = "unlogged.chapter-01.save";
const emptyScores = (): Scores => ({ trust: 0, curiosity: 0, avoidance: 0 });
const initialState = (): GameState => ({ version: 2, currentId: chapter01Start, scores: emptyScores(), chatHistory: [], chatVisible: false });

function isSavedGame(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<GameState>;
  return saved.version === 2
    && typeof saved.currentId === "string"
    && Boolean(getNode(saved.currentId))
    && Boolean(saved.scores)
    && [saved.scores?.trust, saved.scores?.curiosity, saved.scores?.avoidance].every(Number.isFinite)
    && Array.isArray(saved.chatHistory)
    && typeof saved.chatVisible === "boolean";
}

function loadState(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null");
    return isSavedGame(saved) ? saved : initialState();
  } catch {
    return initialState();
  }
}

function enterNode(id: string, state: GameState): GameState {
  let nextId = id;
  let nextState = state;
  while (true) {
    const node = getNode(nextId);
    if (!node) return initialState();
    if (node.kind === "resolve") {
      nextId = node.resolve(nextState.scores);
      continue;
    }
    if (node.kind === "end") return { ...nextState, currentId: nextId, chatVisible: false };
    if (node.kind === "line" && (node.sender === "n" || node.sender === "me")) {
      nextState = { ...nextState, chatHistory: [...nextState.chatHistory, { sender: node.sender, text: node.text }] };
    }
    return { ...nextState, currentId: nextId };
  }
}

const nameFor: Record<Sender, string> = { n: "N", me: "我", narrator: "我 · 心声", system: "QQ · 系统" };

export default function App() {
  const [game, setGame] = useState<GameState>(loadState);
  const [showTitle, setShowTitle] = useState(() => game.currentId === chapter01Start && game.chatHistory.length === 0);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const current = getNode(game.currentId)!;
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    if (!showTitle) return;
    const timeout = window.setTimeout(() => setShowTitle(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [showTitle]);

  useEffect(() => {
    if (current.kind !== "line") {
      setDisplayedText("");
      return;
    }
    setDisplayedText("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedText(current.text.slice(0, index));
      if (index >= current.text.length) window.clearInterval(timer);
    }, 48);
    return () => window.clearInterval(timer);
  }, [current]);

  const advance = () => {
    if (current.kind !== "line") return;
    setGame((state) => enterNode(current.next, state));
  };

  const completeOrAdvance = () => {
    if (current.kind !== "line") return;
    if (displayedText.length < current.text.length) {
      setDisplayedText(current.text);
      return;
    }
    advance();
  };

  const choose = (optionIndex: number) => {
    if (current.kind !== "choice") return;
    const option = current.options[optionIndex];
    setGame((state) => {
      const scores = {
        trust: state.scores.trust + (option.effects?.trust ?? 0),
        curiosity: state.scores.curiosity + (option.effects?.curiosity ?? 0),
        avoidance: state.scores.avoidance + (option.effects?.avoidance ?? 0),
      };
      return enterNode(option.next, { ...state, scores, chatVisible: state.chatVisible || option.showChat === true });
    });
  };

  const restart = () => {
    setGame(initialState());
    setConfirmRestart(false);
    setShowTitle(true);
  };

  return <main className="game-shell" style={{ backgroundImage: `linear-gradient(#070b1299, #070b12d9), url(${backgroundUrl})` }}>
    <section className="game" aria-label="未登录的人，第一章">
      {showTitle && <section className="title-transition" aria-label="第一章，未登录的人"><p>第一章</p><h1>未登录的人</h1></section>}
      <div className="hud">
        <button className="restart-icon" type="button" onClick={() => setConfirmRestart(true)} aria-label="重新开始" title="重新开始">↻</button>
        {confirmRestart && <section className="restart-confirm" role="dialog" aria-label="确认重新开始"><p>要从头开始吗？</p><div><button type="button" onClick={() => setConfirmRestart(false)}>取消</button><button className="danger" type="button" onClick={restart}>重新开始</button></div></section>}
      </div>
      {current.kind !== "end" && <>
        <div className="clock">23:47</div>
        {game.chatVisible && !current.profile && !current.friendsList && <section className="chat-window" aria-label="与 N 的聊天记录"><div className="chat-heading"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>在线</span></div></div><div className="messages">{game.chatHistory.slice(-4).map((line, index) => <ChatBubble key={`${line.text}-${index}`} line={line} />)}</div></section>}
        {current.profile && <ProfileCard />}
        {current.friendsList && <FriendsList />}
        {!game.chatVisible && <div className="opening-space" aria-hidden="true" />}
        {current.friendRequest && <section className="request" aria-label="N 请求添加你为好友"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>请求添加你为好友</span><small>刚刚</small></div></section>}
        {current.kind === "line" && <button className={`say ${current.sender}`} onClick={completeOrAdvance} aria-label={displayedText.length < current.text.length ? "显示完整文字" : "继续"}><strong>{nameFor[current.sender]}</strong><span>{displayedText}{displayedText.length < current.text.length && <i className="typing-caret" aria-hidden="true">_</i>}</span>{displayedText.length >= current.text.length && <small>点击继续 →</small>}</button>}
        {current.kind === "choice" && <section className="choices"><span>{current.prompt}</span>{current.options.map((option, index) => <button key={option.label} onClick={() => choose(index)}>{option.label}</button>)}</section>}
      </>}
      {current.kind === "end" && <section className="ending"><p>章节结束</p><h2>{current.title}</h2><button onClick={restart}>从头开始</button></section>}
    </section>
  </main>;
}

function ChatBubble({ line }: { line: ChatLine }) {
  const isN = line.sender === "n";
  return <div className={`message ${isN ? "from-n" : "from-me"}`}><img src={isN ? nAvatarUrl : playerAvatarUrl} alt="" /><div><small>{isN ? "N" : "我"}</small><p>{line.text}</p></div></div>;
}

function ProfileCard() {
  const fields = [["个性签名", ""], ["性别", "未知"], ["地区", "未知"], ["生日", "--"], ["注册日期", "--"]];
  return <section className="profile-card" aria-label="N 的 QQ 资料"><div className="profile-heading"><span>详细资料</span><i aria-hidden="true">×</i></div><div className="profile-identity"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>QQ 号：--</span></div></div><div className="profile-fields">{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "未填写"}</strong></div>)}</div></section>;
}

function FriendsList() {
  return <section className="friends-list" aria-label="好友列表"><header><strong>我的好友</strong><span>1 / 1</span></header><div className="friend-row offline"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>上次在线：三年前</span></div><small>离线</small></div></section>;
}
