// 形制术语校验 — 质检红线
// 词表：../hanfu-lexicon.json（与站点内容库同仓库，月度复盘增补）
// 规则：block 直接驳回回流 / warn 标记人工必读 / prefer 自动替换后复检
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const lexiconPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'hanfu-lexicon.json');
const lexicon = JSON.parse(readFileSync(lexiconPath, 'utf8'));

export function checkText(text) {
  const result = { blocks: [], warns: [], prefs: [], score: 'pass' };

  for (const rule of lexicon.rules) {
    const re = new RegExp(rule.pattern, 'i');
    if (!re.test(text)) continue;

    if (rule.severity === 'block') {
      result.blocks.push({ id: rule.id, reason: rule.reason, fix: rule.fix });
    } else if (rule.severity === 'warn') {
      result.warns.push({ id: rule.id, reason: rule.reason, fix: rule.fix });
    } else if (rule.severity === 'prefer') {
      result.prefs.push({ id: rule.id, from: rule.pattern, to: rule.fix, reason: rule.reason });
    }
  }

  result.score = result.blocks.length ? 'block' : result.warns.length ? 'warn' : 'pass';
  return result;
}

// prefer 级自动替换（使用词表 replacement 短词；无 replacement 的规则跳过。替换后应复检 block/warn）
export function applyPrefs(text) {
  let out = text;
  const applied = [];
  for (const rule of lexicon.rules) {
    if (rule.severity !== 'prefer' || !rule.replacement) continue;
    const re = new RegExp(rule.pattern, 'gi');
    if (re.test(out)) {
      out = out.replace(new RegExp(rule.pattern, 'gi'), rule.replacement);
      applied.push(rule.id);
    }
  }
  return { text: out, applied };
}

// 生成 prompt 注入用的事实基准（dynasty_map 精简版）
export function factBaseForPrompt() {
  const lines = lexicon.dynasty_map.terms.map(
    (t) => `- ${t.term}：${t.dynasty.join('/')}。${t.note}`
  );
  return [
    '【形制术语事实基准（必须遵守，不得与以下归属冲突）】',
    ...lines,
    '【禁止出现的表述】',
    ...lexicon.rules.filter((r) => r.severity === 'block').map((r) => `- ${r.reason}（${r.fix}）`),
  ].join('\n');
}
