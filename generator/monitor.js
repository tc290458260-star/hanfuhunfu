// 批量生成进度监控：每 10 分钟推送一次到企微（顺便提供审核入口测试审核）
// 独立进程运行：node generator/monitor.js
// 推送内容：已生成进度 + 待审队列 + 审核入口
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 极简 .env 加载
for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { pushMarkdown } = await import('../review/wecom.js');

const LOG = join(ROOT, 'generate-all.log');
const REVIEW_URL = `http://localhost:${process.env.REVIEW_PORT || 3001}`;
const TOKEN = process.env.REVIEW_TOKEN || 'changeme';

// 从日志解析总计划篇数（"铺量模式：本次计划 N 篇"）
function readTotal() {
  try {
    const m = readFileSync(LOG, 'utf8').match(/本次计划 (\d+) 篇/);
    if (m) return Number(m[1]);
  } catch {}
  return 0;
}
const TOTAL = readTotal() || 209;

async function pushProgress() {
  // 1. 生成进度：统计日志里已进队列的篇数 + 当前正在生成的选题
  let done = 0;
  let current = '';
  try {
    const log = readFileSync(LOG, 'utf8');
    done = (log.match(/✅ 已进审核队列/g) || []).length;
    const lines = log.trim().split('\n').filter(Boolean);
    current = lines[lines.length - 1] || '';
    current = current.replace(/\[(A\d+|B\d+)\]\s*/, '').replace(/ → 生成中…/, '（生成中）').slice(0, 30);
  } catch {}

  // 2. 待审队列
  let pending = 0;
  let warned = 0;
  try {
    const res = await fetch(`${REVIEW_URL}/api/queue?status=pending&token=${TOKEN}`);
    const list = await res.json();
    pending = Array.isArray(list) ? list.length : 0;
    warned = Array.isArray(list) ? list.filter((a) => (a.lexicon?.warns?.length || 0) > 0).length : 0;
  } catch {}

  const pct = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
  const lines = [
    '**【汉服婚服网 · 批量生成进度】**',
    `已生成：**${done}** / ${TOTAL} 篇（${pct}%）`,
    `待审：**${pending}** 篇（⚠️ 需人工确认 ${warned} 篇）`,
    current ? `当前：${current}` : '',
    `> [点此进入审核页](http://localhost:3001/)`,
  ].filter(Boolean).join('\n');

  const r = await pushMarkdown(lines).catch((e) => ({ sent: false, error: String(e) }));
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`[monitor] ${time} 推送${r.sent ? '成功' : '失败'}：${done}/${TOTAL}，待审 ${pending}（warn ${warned}）${r.error ? ' | ' + r.error : ''}`);
}

// 立即推一次，之后每 10 分钟推一次
console.log(`[monitor] 启动：每 10 分钟推送一次进度，计划 ${TOTAL} 篇`);
pushProgress();
setInterval(pushProgress, 10 * 60 * 1000);
