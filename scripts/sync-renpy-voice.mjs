import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { transformWithOxc } from "vite";

const root = resolve(import.meta.dirname, "..");
const storySource = await readFile(join(root, "src/story/chapter01.ts"), "utf8");
const compiled = (await transformWithOxc(storySource, "chapter01.ts")).code;
const { getVoicedLines } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const manifest = JSON.parse(await readFile(join(root, "src/voice/manifest.json"), "utf8"));
const lines = getVoicedLines();
const byText = new Map();
for (const line of lines) {
  const key = `${line.sender}\u0000${line.text}`;
  if (byText.has(key)) throw new Error(`Ambiguous voice text: ${line.sender} ${line.text}`);
  if (manifest[line.id] !== line.text) throw new Error(`Missing or stale voice: ${line.id}`);
  byText.set(key, line);
}

const scriptPath = join(root, "game/script.rpy");
const script = await readFile(scriptPath, "utf8");
const output = [];
const matched = new Set();
for (const sourceLine of script.split("\n")) {
  const match = sourceLine.match(/^(\s*)(n|me) "((?:[^"\\]|\\.)*)"$/);
  if (!match) {
    output.push(sourceLine);
    continue;
  }
  const [, indent, sender, encodedText] = match;
  const text = JSON.parse(`"${encodedText}"`);
  const line = byText.get(`${sender}\u0000${text}`);
  if (!line) throw new Error(`No matching Web voice for Ren'Py line: ${sender} ${text}`);
  if (output.at(-1)?.match(/^\s*voice "voice\/chapter01\/[^"\n]+\.mp3"$/)) output.pop();
  output.push(`${indent}voice "voice/chapter01/${line.id}.mp3"`);
  output.push(sourceLine);
  matched.add(line.id);
}
if (matched.size !== lines.length) throw new Error(`Only matched ${matched.size}/${lines.length} voiced lines`);

const targetDir = join(root, "game/voice/chapter01");
await mkdir(targetDir, { recursive: true });
for (const line of lines) {
  await copyFile(join(root, "public/voice/chapter01", `${line.id}.mp3`), join(targetDir, `${line.id}.mp3`));
}
await writeFile(scriptPath, output.join("\n"));
process.stdout.write(`Synced ${matched.size} Ren'Py voice lines and MP3 files.\n`);
