// 企微群机器人推送 — 审核提醒通道
// webhook 来自：企业微信群 → 群设置 → 添加群机器人 → 复制 Webhook 地址
// 环境变量 WECOM_WEBHOOK，未配置时静默跳过（不阻塞流程）
const WEBHOOK = process.env.WECOM_WEBHOOK || '';

export async function pushMarkdown(content) {
  if (!WEBHOOK) {
    console.log('[wecom] 未配置 WECOM_WEBHOOK，跳过推送：', content.slice(0, 50));
    return { sent: false };
  }
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'markdown', markdown: { content } }),
  });
  const data = await res.json();
  if (data.errcode !== 0) throw new Error(`wecom push failed: ${JSON.stringify(data)}`);
  return { sent: true };
}

// 早 9 点审核提醒
export function reviewDigest(pending, warned) {
  const lines = [
    '**【汉服婚服网 · 今日待审】**',
    `待审文章：${pending.length} 篇`,
  ];
  if (warned > 0) lines.push(`⚠️ 其中 ${warned} 篇含形制高危表述，需重点看高亮段落`);
  lines.push(`> [点此审核](http://${process.env.REVIEW_PUBLIC_HOST || 'localhost:3001'}/)`);
  return lines.join('\n');
}
