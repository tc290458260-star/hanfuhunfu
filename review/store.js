// 极简 JSON 文件存储 — 审核队列（MVP 阶段够用，量大后换 SQLite）
// 状态机：pending（待审）→ approved（通过，已写入内容库）/ rejected（驳回，待回流重生成）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
const DB_PATH = join(DATA_DIR, 'queue.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(DB_PATH)) writeFileSync(DB_PATH, '[]');

let queue;
function load() {
  if (!queue) queue = JSON.parse(readFileSync(DB_PATH, 'utf8'));
  return queue;
}
function save() {
  writeFileSync(DB_PATH, JSON.stringify(queue, null, 2));
}

export function addArticle(article) {
  const db = load();
  const id = `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    regenCount: 0,
    ...article, // title / channel / channelName / level / keywords / description / markdown / lexicon
  };
  db.push(record);
  save();
  return record;
}

export function listArticles(status) {
  const db = load();
  return status ? db.filter((a) => a.status === status) : db;
}

export function getArticle(id) {
  return load().find((a) => a.id === id);
}

export function updateArticle(id, patch) {
  const a = getArticle(id);
  if (!a) return null;
  Object.assign(a, patch);
  save();
  return a;
}
