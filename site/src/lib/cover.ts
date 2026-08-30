// 文章封面图统一获取逻辑
// 优先级：cover → coverImage → image → thumbnail → siteConfig.articleCovers[id] → 正文首图 → null
// 前端所有展示点统一调用此函数，避免多套逻辑。
import { siteConfig } from '../data/siteConfig';

export function getArticleCover(article: {
  id?: string;
  data: Record<string, any>;
  body?: string;
}): string | null {
  const d = article.data || {};
  if (d.cover && typeof d.cover === 'string') return d.cover;
  if (d.coverImage && typeof d.coverImage === 'string') return d.coverImage;
  if (d.image && typeof d.image === 'string') return d.image;
  if (d.thumbnail && typeof d.thumbnail === 'string') return d.thumbnail;
  // 站点级配置（按 article id 映射，不改 content schema）
  if (article.id && siteConfig.articleCovers[article.id]) {
    return siteConfig.articleCovers[article.id];
  }
  // 正文第一张有效图片
  const body = article.body || '';
  const m = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/.exec(body);
  return m ? m[1] : null;
}
