// 汉服婚服网 · 审核后台 MVP（零依赖，Node >= 18）
// 职责只有三件事：待审列表 / 预览 / 通过驳回。必须鉴权（REVIEW_TOKEN）。
//
// 启动：REVIEW_TOKEN=换成你的密码 node server.js
// 端口默认 3001，生产部署由 Nginx 反代（如 audit.hanfuhunfu.com 或 /audit 路径）
//
// API：
//   POST /api/articles              {token, title, channel, channelName, level, keywords, description, markdown}
//                                    生成管线提交入口：先过词表，block 直接拒绝回流
//   GET  /api/queue?status=pending  {token} 待审列表
//   GET  /api/articles/:id          {token} 单篇详情（含质检结果）
//   POST /api/articles/:id/approve  {token} 通过 → 写入 Astro 内容库
//   POST /api/articles/:id/reject   {token, reason} 驳回 → 标记待回流重生成
//   POST /api/push-digest           {token} 手动触发企微审核提醒（也可由 cron 调）
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkText, applyPrefs } from './lexicon.js';
import { addArticle, listArticles, getArticle, updateArticle } from './store.js';
import { pushMarkdown, reviewDigest } from './wecom.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const TOKEN = process.env.REVIEW_TOKEN || 'changeme';
const SITE_CONTENT_DIR = join(ROOT, '..', 'site', 'src', 'content', 'articles');

// ---------- 工具 ----------
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > 2_000_000) { reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch { reject(new Error('invalid json')); }
    });
  });
}

function authOk(req, url, body) {
  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '') || url.searchParams.get('token') || body?.token;
  return token === TOKEN;
}

function slugify(title) {
  // 中文标题 → 拼音需要依赖，MVP 用"时间戳+哈希"保证唯一；正式版接入 pinyin 包
  const hash = Buffer.from(title).toString('base64url').slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '') || 'x';
  return `${Date.now().toString(36)}-${hash}`;
}

// ---------- 业务 ----------
function submitArticle(body) {
  const required = ['title', 'channel', 'level', 'markdown'];
  for (const k of required) if (!body[k]) return { code: 400, body: { error: `missing field: ${k}` } };

  // prefer 级自动替换，然后复检
  const { text, applied } = applyPrefs(body.markdown);
  const lexResult = checkText(`${body.title}\n${text}`);

  // block 级：不进审核队列，直接驳回（生成管线拿 lexResult 回流重生成）
  if (lexResult.blocks.length) {
    return { code: 422, body: { accepted: false, rejected: 'lexicon-block', lexicon: lexResult } };
  }

  const record = addArticle({
    title: body.title,
    description: body.description || '',
    channel: body.channel,
    channelName: body.channelName || body.channel,
    level: body.level,
    keywords: body.keywords || [],
    markdown: text,
    prefsApplied: applied,
    lexicon: lexResult,
  });
  return { code: 201, body: { accepted: true, id: record.id, lexicon: lexResult } };
}

function approve(id) {
  const a = getArticle(id);
  if (!a || a.status !== 'pending') return { code: 404, body: { error: 'not found or not pending' } };

  // 写入 Astro 内容库（channel 子目录 + frontmatter）
  const dir = join(SITE_CONTENT_DIR, a.channel);
  mkdirSync(dir, { recursive: true });
  const slug = slugify(a.title);
  const front = [
    '---',
    `title: ${JSON.stringify(a.title)}`,
    `description: ${JSON.stringify(a.description)}`,
    `channel: ${a.channel}`,
    `level: ${a.level}`,
    `keywords: [${a.keywords.map((k) => JSON.stringify(k)).join(', ')}]`,
    `pubDate: ${new Date().toISOString().slice(0, 10)}`,
    `source: deepseek`,
    '---',
    '',
  ].join('\n');
  writeFileSync(join(dir, `${slug}.md`), front + a.markdown + '\n');

  updateArticle(id, { status: 'approved', approvedAt: new Date().toISOString(), slug: `${a.channel}/${slug}` });
  // TODO（正式版）：git commit + push → 触发构建发布 → sitemap 提交
  return { code: 200, body: { ok: true, slug: `${a.channel}/${slug}`, next: '待 git 提交触发站点构建' } };
}

function reject(id, reason) {
  const a = getArticle(id);
  if (!a || a.status !== 'pending') return { code: 404, body: { error: 'not found or not pending' } };
  updateArticle(id, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectReason: reason || '', regenCount: a.regenCount + 1 });
  // TODO（正式版）：回流选题库，带驳回原因重新生成
  return { code: 200, body: { ok: true, regenCount: a.regenCount + 1 } };
}

// 批量通过（铺量模式）：默认通过所有"零 warn"的待审文章；
// 有 warn（形制高危表述）的必须逐篇人工确认，不参与批量。
// 也可显式传 ids: [...] 只批量通过指定篇目。
function bulkApprove(body) {
  const pending = listArticles('pending');
  let targets;
  if (Array.isArray(body?.ids) && body.ids.length) {
    const set = new Set(body.ids);
    targets = pending.filter((a) => set.has(a.id));
  } else {
    targets = pending.filter((a) => (a.lexicon?.warns?.length || 0) === 0);
  }
  let approved = 0;
  for (const a of targets) { if (approve(a.id).code === 200) approved++; }
  const warnCount = pending.filter((a) => (a.lexicon?.warns?.length || 0) > 0).length;
  return {
    code: 200,
    body: { ok: true, approved, warnedLeft: warnCount, scanned: pending.length },
  };
}

// ---------- 路由 ----------
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // 静态审核页（H5）
  if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(ROOT, 'public', 'index.html')));
    return;
  }

  if (!path.startsWith('/api/')) return json(res, 404, { error: 'not found' });

  const body = req.method === 'POST' ? await readBody(req).catch(() => ({})) : {};
  if (!authOk(req, url, body)) return json(res, 401, { error: 'unauthorized' });

  // POST /api/articles — 生成管线提交
  if (req.method === 'POST' && path === '/api/articles') {
    const r = submitArticle(body);
    return json(res, r.code, r.body);
  }

  // GET /api/queue?status=
  if (req.method === 'GET' && path === '/api/queue') {
    return json(res, 200, listArticles(url.searchParams.get('status')));
  }

  // POST /api/queue/bulk-approve — 批量通过（铺量模式：零 warn 的一键通过）
  if (req.method === 'POST' && path === '/api/queue/bulk-approve') {
    const r = bulkApprove(body);
    return json(res, r.code, r.body);
  }

  // /api/articles/:id
  const m = path.match(/^\/api\/articles\/([a-z0-9]+)(\/(approve|reject))?$/i);
  if (m) {
    if (req.method === 'GET' && !m[2]) {
      const a = getArticle(m[1]);
      return a ? json(res, 200, a) : json(res, 404, { error: 'not found' });
    }
    if (req.method === 'POST' && m[3] === 'approve') {
      const r = approve(m[1]);
      return json(res, r.code, r.body);
    }
    if (req.method === 'POST' && m[3] === 'reject') {
      const r = reject(m[1], body.reason);
      return json(res, r.code, r.body);
    }
  }

  // POST /api/push-digest — 手动/定时触发审核提醒
  if (req.method === 'POST' && path === '/api/push-digest') {
    const pending = listArticles('pending');
    const warned = pending.filter((a) => a.lexicon?.score === 'warn').length;
    const r = await pushMarkdown(reviewDigest(pending, warned)).catch((e) => ({ sent: false, error: String(e) }));
    return json(res, 200, { pending: pending.length, warned, ...r });
  }

  return json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`[review] 审核后台已启动 http://localhost:${PORT}/  (token: ${TOKEN === 'changeme' ? '默认 changeme，请设置 REVIEW_TOKEN' : '已配置'})`);
});
