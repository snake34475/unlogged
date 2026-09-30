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

const nameFor: Record<Sender, string> = { n: "N", me: "我", narrator: "", system: "" };

export default function App() {
  const [game, setGame] = useState<GameState>(loadState);
  const current = getNode(game.currentId)!;

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  const advance = () => {
    if (current.kind !== "line") return;
    setGame((state) => enterNode(current.next, state));
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

  const isFriendRequest = current.kind === "choice" && current.id === "friend-request";

  return <main className="game-shell" style={{ backgroundImage: `linear-gradient(#070b1299, #070b12d9), url(${backgroundUrl})` }}>
    <section className="game" aria-label="未登录的人，第一章">
      <header><div><p>第一章</p><h1>未登录的人</h1></div><button className="reset" onClick={() => setGame(initialState())}>重新开始</button></header>
      {current.kind !== "end" && <>
        <div className="clock">23:47</div>
        {game.chatVisible && <section className="chat-window" aria-label="与 N 的聊天记录"><div className="chat-heading"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>在线</span></div></div><div className="messages">{game.chatHistory.slice(-4).map((line, index) => <ChatBubble key={`${line.text}-${index}`} line={line} />)}</div></section>}
        {!game.chatVisible && <div className="opening-space" aria-hidden="true" />}
        {isFriendRequest && <section className="request" aria-label="好友申请"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>请求添加你为好友</span><small>刚刚</small></div></section>}
        {current.kind === "line" && <button className={`say ${current.sender}`} onClick={advance} aria-label="继续">{nameFor[current.sender] && <strong>{nameFor[current.sender]}</strong>}<span>{current.text}</span><small>点击继续</small></button>}
        {current.kind === "choice" && <section className="choices"><span>{current.prompt}</span>{current.options.map((option, index) => <button key={option.label} onClick={() => choose(index)}>{option.label}</button>)}</section>}
      </>}
      {current.kind === "end" && <section className="ending"><p>章节结束</p><h2>{current.title}</h2><button onClick={() => setGame(initialState())}>从头开始</button></section>}
    </section>
  </main>;
}

function ChatBubble({ line }: { line: ChatLine }) {
  const isN = line.sender === "n";
  return <div className={`message ${isN ? "from-n" : "from-me"}`}><img src={isN ? nAvatarUrl : playerAvatarUrl} alt="" /><div><small>{isN ? "N" : "我"}</small><p>{line.text}</p></div></div>;
}
