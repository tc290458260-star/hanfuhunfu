// 首页"专题阅读"配置
// 渲染时由 index.astro 根据真实 articles 匹配，统计文章数与定位
export interface FeaturedTopic {
  id: string;
  title: string;
  description: string;
  // 任意一个关键词命中即算作该专题下文章
  matchKeywords: string[];
  // 没有匹配文章时跳到该频道
  fallbackChannel: string;
}

export const FEATURED_TOPICS: FeaturedTopic[] = [
  {
    id: 'feng-guan',
    title: '凤冠霞帔',
    description: '从凤冠制度、霞帔形制到婚礼中的实际应用。',
    matchKeywords: ['凤冠霞帔', '霞帔', '凤冠', '明制婚服', '蟒袍'],
    fallbackChannel: 'xing-zhi-bai-ke',
  },
  {
    id: 'ming-fu',
    title: '明制婚服',
    description: '认识明代婚服的形制体系、礼仪语境与纹样寓意。',
    matchKeywords: ['明制婚服', '明制', '褙子', '大衫'],
    fallbackChannel: 'xing-zhi-bai-ke',
  },
  {
    id: 'tang-fu',
    title: '唐代婚礼',
    description: '从婚礼仪式到服饰制度，理解唐代婚嫁文化。',
    matchKeywords: ['唐代', '唐制', '催妆', '却扇', '唐风'],
    fallbackChannel: 'hun-jia-liu-li',
  },
  {
    id: 'wen-yang',
    title: '婚服纹样',
    description: '龙凤、牡丹、祥云等传统纹样的寓意与来源。',
    matchKeywords: ['纹样', '龙纹', '凤纹', '刺绣', '云纹'],
    fallbackChannel: 'wen-hua-leng-zhi-shi',
  },
];
