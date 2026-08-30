// 汉服婚服网 · 内容生成器（B 模式：服务器 cron 调 DeepSeek 批量生成）
// 用法：
//   node generate.js --id B102                  生成指定选题
//   node generate.js --count 3 --level B        批量生成 3 篇 B 级（跳过已生成的）
//   node generate.js --count 2 --level B --channel CH01   限定频道
// 环境变量读项目根 .env（DEEPSEEK_API_KEY / DEEPSEEK_MODEL / REVIEW_TOKEN / REVIEW_PORT）
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 极简 .env 加载（不引依赖） ----------
for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const REVIEW_URL = `http://localhost:${process.env.REVIEW_PORT || 3001}`;
const TOKEN = process.env.REVIEW_TOKEN || 'changeme';
if (!API_KEY) { console.error('缺少 DEEPSEEK_API_KEY'); process.exit(1); }

// ---------- 频道映射（与 site/src/lib/channels.ts 同步维护） ----------
const CHANNELS = {
  CH01: { slug: 'hun-jia-liu-li', name: '婚嫁六礼' },
  CH02: { slug: 'xing-zhi-bai-ke', name: '形制百科' },
  CH03: { slug: 'xuan-gou-jue-ce', name: '选购决策' },
  CH04: { slug: 'chuan-da-zao-xing', name: '穿搭与造型' },
  CH05: { slug: 'jia-ge-zu-lin', name: '价格与租赁' },
  CH06: { slug: 'cheng-du-ben-di', name: '成都本地服务' },
  CH07: { slug: 'xin-lang-zhuang-shu', name: '新郎装束' },
  CH08: { slug: 'dao-ju-chang-jing', name: '道具与场景' },
  CH09: { slug: 'hun-zhao-wai-jing', name: '婚照与外景' },
  CH10: { slug: 'xin-zhong-shi', name: '新中式专题' },
  CH11: { slug: 'wen-hua-leng-zhi-shi', name: '文化与冷知识' },
  CH12: { slug: 'ti-xing-chi-ma', name: '体型与尺码' },
  CH13: { slug: 'liu-cheng-yang-hu', name: '流程养护售后' },
  CH14: { slug: 'qin-you-shi-jiao', name: '亲友视角' },
};

// ---------- 解析内容地图 ----------
function parseContentMap() {
  const md = readFileSync(join(ROOT, 'content-map.md'), 'utf8');
  const topics = [];
  let channelCode = null;
  for (const line of md.split('\n')) {
    const ch = line.match(/^## (CH\d+)\s+(.+?)\s*$/);
    if (ch) { channelCode = ch[1]; continue; }
    const row = line.match(/^\| ([SAB]\d+) \| (.+?) \| ([SAB]) \| (.+?) \| (.*?) \|$/);
    if (row && channelCode) {
      topics.push({
        id: row[1], title: row[2].trim(), level: row[3],
        keywords: row[4].trim().split(/\s+/).filter(Boolean),
        secondary: row[5].trim().split(/\s+/).filter(Boolean),
        channelCode, ...CHANNELS[channelCode],
      });
    }
  }
  return topics;
}

// ---------- 已生成记录（去重 + 驳回回流状态） ----------
const STATE_FILE = join(ROOT, 'generator', 'state.json');
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : { done: {} };
function saveState() { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ---------- DeepSeek 调用 ----------
const { factBaseForPrompt } = await import('../review/lexicon.js');

function buildPrompt(topic, feedback) {
  const lengthReq = topic.level === 'A' ? '1500–2000 字' : '800–1200 字';
  const sys = `你是"汉服婚服网"（hanfuhunfu.com）的资深内容编辑，精通中国传统服饰史与婚俗礼制，为筹备汉服婚礼的新人写科普与实用指南。

${factBaseForPrompt()}

写作铁律：
1. 形制术语的朝代归属绝不能出错，与上方事实基准冲突的表述禁止出现
2. 有明确史实出处的（如六礼、凤冠霞帔品级）给出依据朝代；今人约定俗成的做法要标"现代常见做法"
3. 语言：普通话书面语，亲切但专业，不说"小编""亲们"，不堆砌感叹号
4. 结构：开头直接回答选题核心问题（AI 摘要友好），用二级标题分节，关键结论加粗
5. 站点是成都"天赐华裳"汉服婚服租赁的知识站，可在结尾自然提及"到店试穿/租赁服务"，但正文以知识为主，不硬广
6. 配图位用 <!-- img: 门店实拍|SVG示意图|混元生图 | 说明文字 --> 注释占位，不虚构图片
7. 输出纯 JSON：{"title": "...", "description": "60字内摘要", "keywords": ["主关键词","次词"], "markdown": "正文，markdown格式"}`;

  const user = `选题：${topic.title}
频道：${topic.channelName}（${topic.channelCode}）
内容分级：${topic.level} 级（${topic.level === 'A' ? '常规质量，结构完整' : '长尾科普，直击问题'}）
目标关键词：${topic.keywords.join('、')}
次要关键词：${topic.secondary.join('、')}
篇幅要求：${lengthReq}
${feedback ? `\n【上一版被词表质检驳回，必须修正后重写】\n${feedback}` : ''}`;

  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ];
}

async function callDeepSeek(messages) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ---------- 提交审核队列（含 block 回流重试一次） ----------
async function submitToReview(topic, article) {
  const body = JSON.stringify({
    token: TOKEN,
    title: article.title,
    description: article.description,
    channel: topic.slug,
    channelName: topic.name,
    level: topic.level,
    keywords: [...new Set([...(article.keywords || []), ...topic.keywords])].slice(0, 6),
    markdown: article.markdown,
  });
  const res = await fetch(`${REVIEW_URL}/api/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function generateOne(topic) {
  console.log(`[${topic.id}] ${topic.title} → 生成中…`);
  let article;
  try {
    article = await callDeepSeek(buildPrompt(topic));
  } catch (e) {
    console.error(`[${topic.id}] DeepSeek 调用失败：${e.message}`);
    return false;
  }

  let r = await submitToReview(topic, article);

  // block 级违规 → 带质检反馈回流重生成一次
  if (r.status === 422 && r.json.rejected === 'lexicon-block') {
    const feedback = r.json.lexicon.blocks
      .map((b) => `- 违规「${b.reason}」→ 修正：${b.fix}`)
      .join('\n');
    console.log(`[${topic.id}] 词表拦截，回流重生成：${feedback.split('\n')[0]}`);
    try {
      article = await callDeepSeek(buildPrompt(topic, feedback));
      r = await submitToReview(topic, article);
    } catch (e) {
      console.error(`[${topic.id}] 重生成失败：${e.message}`);
      return false;
    }
  }

  if (r.status === 201) {
    state.done[topic.id] = { queueId: r.json.id, title: article.title, at: new Date().toISOString() };
    saveState();
    const warns = r.json.lexicon.warns.length ? `，warn ${r.json.lexicon.warns.length} 处（审核页高亮）` : '';
    console.log(`[${topic.id}] ✅ 已进审核队列（id=${r.json.id}${warns}）`);
    return true;
  }
  console.error(`[${topic.id}] ❌ 提交失败 HTTP ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  return false;
}

// ---------- CLI ----------
const args = process.argv.slice(2);
const get = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };

const topics = parseContentMap();
console.log(`内容地图解析：${topics.length} 个选题（S${topics.filter(t => t.level === 'S').length} / A${topics.filter(t => t.level === 'A').length} / B${topics.filter(t => t.level === 'B').length}）`);

let picks = [];
const id = get('id');
if (id) {
  picks = topics.filter((t) => t.id === id);
  if (!picks.length) { console.error(`找不到选题 ${id}`); process.exit(1); }
} else {
  const count = Number(get('count') || 1);
  const level = (get('level') || 'B').toUpperCase();
  const channel = get('channel');
  if (level === 'S') { console.error('S 级必须 WorkBuddy 精产，不走本管线'); process.exit(1); }
  picks = topics.filter((t) => t.level === level && !state.done[t.id] && (!channel || t.channelCode === channel)).slice(0, count);
}

if (!picks.length) { console.log('没有待生成选题（可能都生成过了）'); process.exit(0); }

let ok = 0;
for (const t of picks) { if (await generateOne(t)) ok++; }
console.log(`\n完成：${ok}/${picks.length}。审核入口：${REVIEW_URL}/`);
