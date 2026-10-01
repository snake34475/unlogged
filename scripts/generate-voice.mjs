import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { transformWithOxc } from "vite";

const root = resolve(import.meta.dirname, "..");
const outputDir = join(root, "public/voice/chapter01");
const manifestPath = join(root, "src/voice/manifest.json");
const args = process.argv.slice(2);
const force = args.includes("--force");
const selectedId = args.find((arg) => arg.startsWith("--id="))?.slice(5);
const listOnly = args.includes("--list");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
if (!Number.isInteger(limit) && limit !== Infinity || limit < 1) {
  throw new Error("--limit must be a positive integer");
}

const source = await readFile(join(root, "src/story/chapter01.ts"), "utf8");
const compiled = (await transformWithOxc(source, "chapter01.ts")).code;
const { getVoicedLines } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const allLines = getVoicedLines();
const lines = selectedId ? allLines.filter((line) => line.id === selectedId) : allLines;
if (selectedId && lines.length === 0) throw new Error(`Unknown voiced line: ${selectedId}`);
if (listOnly) {
  for (const line of lines) process.stdout.write(`${line.id}\t${line.sender}\t${line.text}\n`);
  process.exit(0);
}

let key = process.env.MIMO_API_KEY;
if (!key) {
  try {
    const env = await readFile(join(root, ".env.local"), "utf8");
    const match = env.match(/^MIMO_API_KEY\s*=\s*(.+)\s*$/m);
    key = match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  } catch { /* Environment variable may be supplied directly. */ }
}
if (!key) throw new Error("Set MIMO_API_KEY in .env.local or the environment.");

const voicePrompts = {
  me: "18岁左右的中文男声，普通话自然，音色中低、略干，带一点熬夜后的轻微疲惫，但吐字清楚。说话像用随口的玩笑掩饰尴尬，语速中等，句首偶尔犹豫；紧张时先短暂停顿，再认真发问，不要刻意卖惨或持续低沉。",
  n: "18至20岁的中文女声，普通话自然，音色明亮而略带一点低哑质感，气息放松，节奏利落。像熟人一样随口调侃，对答快半拍，笑意藏在语尾，不夸张笑或撒娇；说中对方心事时稍放慢、稍放轻，仍保持亲近感。",
};
const lineDirection = {
  "friend-agree-1": "这句是在陌生账号突然发来“晚上好”之后的第一反应。开口前轻吸一口气，犹豫约半秒；“你”说得轻一点，“谁”尾音微微上扬。像是先确认自己没认错人，带一点警惕，但不要凶或质问。",
};

async function generate(line) {
  const response = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mimo-v2.5-tts-voicedesign",
      messages: [
        { role: "user", content: [voicePrompts[line.sender], lineDirection[line.id]].filter(Boolean).join("\n") },
        { role: "assistant", content: line.text },
      ],
      audio: { format: "mp3", optimize_text_preview: false },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`${line.id}: MiMo HTTP ${response.status}: ${body.slice(0, 400)}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  const data = payload.choices?.[0]?.message?.audio?.data;
  if (typeof data !== "string" || !data) throw new Error(`${line.id}: no audio data returned`);
  return Buffer.from(data, "base64");
}

await mkdir(outputDir, { recursive: true });
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
let generated = 0;
for (const line of lines) {
  const file = join(outputDir, `${line.id}.mp3`);
  let exists = false;
  try { await access(file); exists = true; } catch { /* Generate missing clip. */ }
  if (!force && exists && manifest[line.id] === line.text) continue;
  if (generated >= limit) break;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const bytes = await generate(line);
      await writeFile(file, bytes);
      manifest[line.id] = line.text;
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      generated += 1;
      process.stdout.write(`Generated ${line.id} (${bytes.length} bytes)\n`);
      break;
    } catch (error) {
      if (attempt === 2 || error.status && error.status !== 429 && error.status < 500) throw error;
      await new Promise((done) => setTimeout(done, 1500 * 2 ** attempt));
    }
  }
  await new Promise((done) => setTimeout(done, 650));
}
process.stdout.write(`Complete: ${generated} new clips, ${lines.length} possible voiced lines.\n`);
