export type Sender = "n" | "me" | "narrator" | "system";
export type Scores = { trust: number; curiosity: number; avoidance: number };

type SceneState = { friendRequest?: boolean };
type LineNode = SceneState & { kind: "line"; id: string; sender: Sender; text: string; next: string };
type ChoiceNode = SceneState & { kind: "choice"; id: string; prompt: string; options: Array<{ label: string; next: string; effects?: Partial<Scores>; showChat?: boolean }> };
type ResolveNode = SceneState & { kind: "resolve"; id: string; resolve: (scores: Scores) => string };
type EndNode = SceneState & { kind: "end"; id: string; title: string };
export type StoryNode = LineNode | ChoiceNode | ResolveNode | EndNode;

const nodes: Record<string, StoryNode> = {};

function lines(prefix: string, content: Array<[Sender, string]>, next: string): string {
  let following = next;
  for (let index = content.length - 1; index >= 0; index -= 1) {
    const id = `${prefix}-${index}`;
    const [sender, text] = content[index];
    nodes[id] = { kind: "line", id, sender, text, next: following };
    following = id;
  }
  return following;
}

const endingTomorrow = lines("ending-tomorrow", [
  ["me", "明天见一面。你敢吗？"],
  ["n", "好啊。"],
  ["n", "放学以后，去操场。"],
  ["me", "找你？"],
  ["n", "找一个人。"],
  ["n", "到时候你就知道了。"],
  ["system", "N 已离线。她的头像灰下去前，我好像看见状态栏写着：从未登录。"],
], "end-tomorrow");
nodes["end-tomorrow"] = { kind: "end", id: "end-tomorrow", title: "END 01 · 明天见" };

const endingLoop = lines("ending-loop", [
  ["me", "你到底是谁？"],
  ["n", "一个不应该在今晚联系你的人。"],
  ["system", "网络连接中断。"],
  ["system", "聊天窗口关闭。"],
  ["system", "电脑桌面上的时间是 23:47。"],
  ["system", "滴。账号 N 请求添加你为好友。"],
], "end-loop");
nodes["end-loop"] = { kind: "end", id: "end-loop", title: "END 02 · 23:47" };

const endingAbsent = lines("ending-absent", [
  ["me", "我不想玩了。"],
  ["n", "好。晚安。"],
  ["system", "我关闭窗口，再打开好友列表。"],
  ["system", "没有 N。没有好友申请。没有新的聊天记录。"],
  ["system", "手机震了一下。未知号码：你刚才为什么不相信我？"],
], "end-absent");
nodes["end-absent"] = { kind: "end", id: "end-absent", title: "END 03 · 她从未存在" };

nodes.resolve = {
  kind: "resolve",
  id: "resolve",
  resolve: ({ trust, curiosity, avoidance }) => {
    if (trust >= curiosity && trust >= avoidance) return endingTomorrow;
    if (curiosity >= avoidance) return endingLoop;
    return endingAbsent;
  },
};

const finalSequence = lines("final", [
  ["n", "你刚才是不是把游戏关了？"],
  ["me", "你怎么知道？"],
  ["n", "因为我就在你旁边。"],
  ["narrator", "我回头。"],
  ["narrator", "房间里只有电脑风扇在响。"],
  ["n", "别回头。"],
  ["n", "你会错过消息。"],
  ["system", "右上角的时间仍然是 23:47。"],
], "resolve");

nodes["white-coat-choice"] = {
  kind: "choice",
  id: "white-coat-choice",
  prompt: "你准备：",
  options: [
    { label: "你到底想做什么？", next: lines("white-purpose", [["me", "你到底想做什么？"], ["n", "确认你会不会回我。"], ["me", "现在确认完了吗？"], ["n", "还差一点。"]], finalSequence), effects: { trust: 2 } },
    { label: "你怎么知道她？", next: lines("white-how", [["me", "你怎么知道她？"], ["n", "因为你看她的时候，和看其他人不一样。"], ["me", "你在学校盯着我？"], ["n", "你终于问了一个接近的问题。"]], finalSequence), effects: { curiosity: 2 } },
    { label: "不回复。", next: lines("white-silent", [["narrator", "我没有回复。"], ["narrator", "聊天框上方出现了：N 正在输入。"], ["narrator", "一分钟过去，输入状态没有消失。"], ["n", "不回复也算一种回答。"]], finalSequence), effects: { avoidance: 2 } },
  ],
};

const whiteCoatSequence = lines("white-coat", [
  ["n", "今天穿白色外套的那个女孩，没有上线。"],
  ["narrator", "我坐直了一点。"],
  ["narrator", "她甚至没有说名字。"],
], "white-coat-choice");

nodes["sleep-choice"] = {
  kind: "choice",
  id: "sleep-choice",
  prompt: "你准备：",
  options: [
    { label: "你认识我？", next: lines("sleep-know", [["me", "你认识我？"], ["n", "今天见过。"], ["me", "在哪？"], ["n", "你们学校。"]], whiteCoatSequence), effects: { curiosity: 2 } },
    { label: "你在我电脑里装监控？", next: lines("sleep-monitor", [["me", "你在我电脑里装监控？"], ["n", "太麻烦了。"], ["n", "我只是看见了。"], ["me", "这句话一点也不像玩笑。"]], whiteCoatSequence), effects: { trust: 1 } },
    { label: "猜的吧。", next: lines("sleep-guess", [["me", "猜的吧。"], ["n", "嗯。"], ["n", "你也可以一直这么想。"]], whiteCoatSequence), effects: { avoidance: 2 } },
  ],
};

const sleepSequence = lines("sleep", [["n", "你准备睡了？"], ["me", "嗯。"], ["n", "骗人。"], ["n", "你刚才打开游戏了。"]], "sleep-choice");

nodes["friend-request"] = {
  kind: "choice",
  id: "friend-request",
  prompt: "",
  options: [
    { label: "同意。", next: lines("friend-agree", [["n", "晚上好。"], ["me", "你谁？"], ["n", "这么直接？那现在认识了。"]], sleepSequence), effects: { trust: 1 }, showChat: true },
    { label: "拒绝。", next: lines("friend-decline", [["system", "好友请求已拒绝。"], ["narrator", "两秒后，账号 N 再次请求添加你为好友。"], ["n", "你点拒绝的时候，动作倒是挺快。"], ["me", "你怎么能发消息？"], ["n", "现在同意我，就能慢慢解释。"]], sleepSequence), effects: { avoidance: 1 }, showChat: true },
    { label: "先看一下资料。", next: lines("friend-profile", [["system", "资料页是空的。"], ["narrator", "没有地区，没有签名，注册日期显示为 --。"], ["n", "看完了吗？"], ["me", "你资料怎么是空的？"], ["n", "因为没有什么值得写。"]], sleepSequence), effects: { curiosity: 1 }, showChat: true },
  ],
};

nodes["opening-choice"] = {
  kind: "choice",
  id: "opening-choice",
  prompt: "你准备：",
  options: [
    { label: "打一局再说。", next: lines("opening-game", [["narrator", "游戏启动。"], ["narrator", "三分钟后，我关掉了它。"], ["narrator", "今天什么都不想玩。"]], "friend-request") },
    { label: "还是早点睡吧。", next: lines("opening-sleep", [["narrator", "我合上电脑。"], ["narrator", "两秒后，又把它打开了。"]], "friend-request") },
    { label: "先看看 QQ。", next: lines("opening-qq", [["narrator", "在线 7 人。"], ["narrator", "其中有一个灰色头像，我已经看了五分钟。"]], "friend-request") },
  ],
};

export const chapter01Start = lines("opening", [
  ["narrator", "23:47。"],
  ["narrator", "明天早上七点二十到校。"],
  ["narrator", "如果现在睡觉，还能睡七个小时。"],
  ["narrator", "如果打一局游戏，大概只能睡六个小时。"],
  ["narrator", "所以问题来了。"],
  ["narrator", "我为什么还没有开始打游戏？"],
  ["system", "滴。"],
  ["system", "一个陌生账号请求添加你为好友。"],
], "opening-choice");

// Ren'Py shows the friend request before the notification sound, then keeps it
// visible through the two explanatory lines and the decision.
nodes["opening-6"].friendRequest = true;
nodes["opening-7"].friendRequest = true;
nodes["friend-request"].friendRequest = true;

export function getNode(id: string): StoryNode | undefined {
  return nodes[id];
}
