// 站点级前端配置（图片体系）
// 图片来源：当前使用站点自有的门店实拍。后续接入后台上传后，这里改为读取后台配置。
export const siteConfig = {
  /** Hero 主视觉：竖版汉服婚服图（约 4:5，用于首页右侧） */
  heroImage: '/images/hero-feng-guan.jpg',
  /** 专题图片：按专题 id 映射 */
  topicImages: {
    'feng-guan': '/images/topic-feng-guan.jpg',
    'ming-fu': '/images/topic-ming-fu.jpg',
    'tang-fu': '/images/topic-tang-fu.jpg',
    'wen-yang': '/images/topic-wen-yang.jpg',
  },
  /** 文章封面图映射：按 article.id（entry id，如 "channel/slug"） */
  articleCovers: {
    'hun-jia-liu-li/mtfhgzxu-5yks5aag': '/images/topic-tang-fu.jpg',     // 催妆诗 → 唐代圆领袍
    'hun-jia-liu-li/mtfj3a00-57qz6yeh': '/images/topic-feng-guan.jpg',    // 纳采用雁 → 凤冠霞帔
  } as Record<string, string>,
};
