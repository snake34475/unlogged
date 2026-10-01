import { useEffect, useRef, useState } from "react";
import backgroundUrl from "../game/images/bg/room_night.jpg";
import nAvatarUrl from "../game/images/avatars/n_unknown.jpg";
import playerAvatarUrl from "../game/images/avatars/player_unknown.jpg";
import { chapter01Start, getNode, type Scores, type Sender } from "./story/chapter01";
import { hasAnyVoiceClips, useVoicePlayback } from "./voice/useVoicePlayback";

type ChatLine = { sender: "n" | "me"; text: string };
type StoryLine = { id: string; sender: Sender; text: string };
type GameState = { version: 3; currentId: string; scores: Scores; chatHistory: ChatLine[]; storyHistory: StoryLine[]; chatVisible: boolean };
type LegacyGameState = Omit<GameState, "version" | "storyHistory"> & { version: 2 };

const SAVE_KEY = "unlogged.chapter-01.save";
const emptyScores = (): Scores => ({ trust: 0, curiosity: 0, avoidance: 0 });
const initialState = (): GameState => enterNode(chapter01Start, { version: 3, currentId: chapter01Start, scores: emptyScores(), chatHistory: [], storyHistory: [], chatVisible: false });

function isSavedGame(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<GameState>;
  return saved.version === 3
    && typeof saved.currentId === "string"
    && Boolean(getNode(saved.currentId))
    && Boolean(saved.scores)
    && [saved.scores?.trust, saved.scores?.curiosity, saved.scores?.avoidance].every(Number.isFinite)
    && Array.isArray(saved.chatHistory)
    && Array.isArray(saved.storyHistory)
    && typeof saved.chatVisible === "boolean";
}

function isLegacySavedGame(value: unknown): value is LegacyGameState {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<LegacyGameState>;
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
    if (isSavedGame(saved)) return saved;
    if (isLegacySavedGame(saved)) {
      const node = getNode(saved.currentId);
      const storyHistory = node?.kind === "line" ? [{ id: node.id, sender: node.sender, text: node.text }] : [];
      return { ...saved, version: 3, storyHistory };
    }
    return initialState();
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
    if (node.kind === "line") {
      const storyHistory = [...nextState.storyHistory, { id: node.id, sender: node.sender, text: node.text }];
      nextState = node.sender === "n" || node.sender === "me"
        ? { ...nextState, storyHistory, chatHistory: [...nextState.chatHistory, { sender: node.sender, text: node.text }] }
        : { ...nextState, storyHistory };
    }
    return { ...nextState, currentId: nextId };
  }
}

const nameFor: Record<Sender, string> = { n: "N", me: "我", narrator: "我 · 心声", system: "QQ · 系统" };

export default function App() {
  const [game, setGame] = useState<GameState>(loadState);
  const [showTitle, setShowTitle] = useState(() => game.currentId === chapter01Start && game.chatHistory.length === 0);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<"chapters" | "saves" | "achievements" | "codex" | "settings">("chapters");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProgress, setHistoryProgress] = useState(100);
  const [textSpeed, setTextSpeed] = useState<"慢" | "标准" | "快">("标准");
  const [automaticVoice, setAutomaticVoice] = useState(() => localStorage.getItem("unlogged.voice.autoplay.v2") !== "false");
  const current = getNode(game.currentId)!;
  const voice = useVoicePlayback(current.id, current.kind === "line" ? current.text : "", automaticVoice, showTitle || menuOpen || historyOpen || current.kind !== "line");
  const [displayedText, setDisplayedText] = useState("");
  const historyBody = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    localStorage.setItem("unlogged.voice.autoplay.v2", String(automaticVoice));
  }, [automaticVoice]);

  useEffect(() => {
    if (!showTitle) return;
    const timeout = window.setTimeout(() => setShowTitle(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [showTitle]);

  useEffect(() => {
    setDisplayedText("");
  }, [current]);

  useEffect(() => {
    if (current.kind !== "line" || historyOpen || displayedText.length >= current.text.length) return;
    const timer = window.setTimeout(() => setDisplayedText(current.text.slice(0, displayedText.length + 1)), textSpeed === "慢" ? 70 : textSpeed === "快" ? 28 : 48);
    return () => window.clearTimeout(timer);
  }, [current, displayedText, historyOpen, textSpeed]);

  useEffect(() => {
    if (!historyOpen || !historyBody.current) return;
    const body = historyBody.current;
    body.scrollTop = body.scrollHeight;
    setHistoryProgress(100);
  }, [historyOpen]);

  const advance = () => {
    if (current.kind !== "line") return;
    setGame((state) => enterNode(current.next, state));
  };

  const completeOrAdvance = () => {
    if (current.kind !== "line") return;
    if (displayedText.length < current.text.length) {
      voice.retryOnGesture();
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
    setMenuOpen(false);
    setHistoryOpen(false);
    setShowTitle(true);
  };

  const updateHistoryProgress = () => {
    const body = historyBody.current;
    if (!body) return;
    const travel = body.scrollHeight - body.clientHeight;
    setHistoryProgress(travel <= 0 ? 100 : Math.round((body.scrollTop / travel) * 100));
  };

  return <main className="game-shell" style={{ backgroundImage: `linear-gradient(#070b1299, #070b12d9), url(${backgroundUrl})` }}>
    <section className="game" aria-label="未登录的人，第一章">
      {showTitle && <section className="title-transition" aria-label="第一章，未登录的人"><p>第一章</p><h1>未登录的人</h1></section>}
      <div className="hud">
        {voice.available && !showTitle && current.kind === "line" && <button className={`voice-icon${voice.needsGesture ? " voice-needs-gesture" : ""}`} type="button" onClick={voice.toggle} aria-label={voice.playing ? "暂停当前语音" : voice.needsGesture ? "点击启用语音" : "播放当前语音"} aria-pressed={voice.playing}>{voice.needsGesture ? "点击启用语音" : voice.playing ? "Ⅱ" : "▶"}</button>}
        <button className="history-icon" type="button" onClick={() => { setMenuOpen(false); setHistoryOpen(true); }} aria-label="打开对话记录">对话记录</button>
        <button className="menu-icon" type="button" onClick={() => { setHistoryOpen(false); setMenuOpen((open) => !open); }} aria-expanded={menuOpen} aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>☰</button>
        {confirmRestart && <section className="restart-confirm" role="dialog" aria-label="确认重新开始"><p>要从头开始吗？</p><div><button type="button" onClick={() => setConfirmRestart(false)}>取消</button><button className="danger" type="button" onClick={restart}>重新开始</button></div></section>}
      </div>
      {menuOpen && <><button className="menu-scrim" type="button" aria-label="关闭菜单" onClick={() => setMenuOpen(false)} /><GameMenu activeTab={menuTab} onSelect={setMenuTab} onClose={() => setMenuOpen(false)} onRestart={() => { setMenuOpen(false); setConfirmRestart(true); }} textSpeed={textSpeed} onTextSpeed={setTextSpeed} automaticVoice={automaticVoice} onAutomaticVoice={setAutomaticVoice} /></>}
      {historyOpen && <><button className="history-scrim" type="button" aria-label="关闭对话记录" onClick={() => setHistoryOpen(false)} /><section className="history-panel" aria-label="对话记录"><header><div><strong>对话记录</strong><span>第一章 · 未登录的人</span></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label="关闭对话记录">×</button></header><div className="history-progress"><i style={{ width: `${historyProgress}%` }} /></div><div className="history-body" ref={historyBody} onScroll={updateHistoryProgress}>{game.storyHistory.map((line) => <article className={`history-entry ${line.sender}`} key={line.id}><strong>「{nameFor[line.sender]}」</strong><p>{line.id === current.id ? displayedText : line.text}</p></article>)}</div><footer><span>{historyProgress}%</span><span>滚动回看</span></footer></section></>}
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
  const fields = [["个性签名", ""], ["性别", "未知"], ["地区", "未知"], ["生日", "保密"]];
  return <section className="profile-card" aria-label="N 的 QQ 资料"><div className="profile-heading"><span>详细资料</span><i aria-hidden="true">×</i></div><div className="profile-identity"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>QQ 号：20478139</span></div></div><div className="profile-fields">{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "未填写"}</strong></div>)}</div></section>;
}

function FriendsList() {
  return <section className="friends-list" aria-label="好友列表"><header><strong>我的好友</strong><span>1 / 1</span></header><div className="friend-row offline"><img src={nAvatarUrl} alt="N 的头像" /><div><strong>N</strong><span>上次在线：三年前</span></div><small>离线</small></div></section>;
}

type MenuTab = "chapters" | "saves" | "achievements" | "codex" | "settings";

function GameMenu({ activeTab, onSelect, onClose, onRestart, textSpeed, onTextSpeed, automaticVoice, onAutomaticVoice }: { activeTab: MenuTab; onSelect: (tab: MenuTab) => void; onClose: () => void; onRestart: () => void; textSpeed: "慢" | "标准" | "快"; onTextSpeed: (speed: "慢" | "标准" | "快") => void; automaticVoice: boolean; onAutomaticVoice: (enabled: boolean) => void }) {
  const items: Array<[MenuTab, string]> = [["chapters", "章节选择"], ["saves", "存档管理"], ["achievements", "成就"], ["codex", "图鉴"], ["settings", "设置"]];
  return <section className="menu-panel" aria-label="游戏菜单"><aside><div className="menu-brand"><span>UNLOGGED</span><small>第一章 · 未登录的人</small></div><button className="continue-game" type="button" onClick={onClose}>继续游戏</button><nav>{items.map(([tab, label]) => <button type="button" key={tab} className={activeTab === tab ? "active" : ""} onClick={() => onSelect(tab)}>{label}</button>)}</nav><div className="menu-bottom"><button type="button" onClick={onRestart}>重新开始本章</button><button type="button" disabled>返回标题</button></div></aside><main><button className="menu-close" type="button" onClick={onClose} aria-label="关闭菜单">×</button><MenuContent tab={activeTab} textSpeed={textSpeed} onTextSpeed={onTextSpeed} automaticVoice={automaticVoice} onAutomaticVoice={onAutomaticVoice} onClose={onClose} /></main></section>;
}

function MenuContent({ tab, textSpeed, onTextSpeed, automaticVoice, onAutomaticVoice, onClose }: { tab: MenuTab; textSpeed: "慢" | "标准" | "快"; onTextSpeed: (speed: "慢" | "标准" | "快") => void; automaticVoice: boolean; onAutomaticVoice: (enabled: boolean) => void; onClose: () => void }) {
  if (tab === "chapters") return <div className="menu-content"><p className="menu-kicker">CHAPTERS</p><h2>章节选择</h2><button className="chapter-card" type="button" onClick={onClose}><span>CHAPTER 01</span><strong>未登录的人</strong><small>进行中 · 23:47</small><i>继续 →</i></button></div>;
  if (tab === "saves") return <div className="menu-content"><p className="menu-kicker">SAVES</p><h2>存档管理</h2><div className="empty-state"><strong>自动存档</strong><span>当前章节会在每次推进后保存。</span><small>手动存档位将在多章节版本开放。</small></div></div>;
  if (tab === "achievements") return <div className="menu-content"><p className="menu-kicker">ACHIEVEMENTS</p><h2>成就</h2><div className="empty-state"><strong>0 / 3 已解锁</strong><span>不同的选择会带往不同的结局。</span></div></div>;
  if (tab === "codex") return <div className="menu-content"><p className="menu-kicker">ARCHIVE</p><h2>图鉴</h2><div className="empty-state"><strong>档案尚未解锁</strong><span>收集角色、账号与场景的异常线索。</span></div></div>;
  return <div className="menu-content"><p className="menu-kicker">SETTINGS</p><h2>设置</h2><div className="setting-row"><span>文字速度</span><div>{(["慢", "标准", "快"] as const).map((speed) => <button type="button" className={textSpeed === speed ? "active" : ""} onClick={() => onTextSpeed(speed)} key={speed}>{speed}</button>)}</div></div><div className="setting-row"><span>语音自动播放</span><div><button type="button" className={!automaticVoice ? "active" : ""} onClick={() => onAutomaticVoice(false)}>关闭</button><button type="button" className={automaticVoice ? "active" : ""} onClick={() => onAutomaticVoice(true)} disabled={!hasAnyVoiceClips()}>开启</button></div></div></div>;
}
