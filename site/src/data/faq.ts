// 首页"新人常问"配置
// 渲染时由 index.astro 根据真实 articles 匹配：命中任意关键词即链接到该文章
// 没有命中文章的常问自动隐藏（不显示不存在的链接）
export interface FaqItem {
  id: string;
  question: string;
  matchKeywords: string[];
  // 兜底：按 channel 找最新一篇文章
  fallbackChannel?: string;
}

export const FAQS: FaqItem[] = [
  {
    id: 'long-pao',
    question: '龙袍只有男人能穿吗？',
    matchKeywords: ['龙袍', '龙纹', '纹样', '婚服'],
    fallbackChannel: 'wen-hua-leng-zhi-shi',
  },
  {
    id: 'feng-guan',
    question: '凤冠霞帔到底指什么？',
    matchKeywords: ['凤冠霞帔', '霞帔', '凤冠', '明制婚服'],
    fallbackChannel: 'xing-zhi-bai-ke',
  },
  {
    id: 'dynasty-diff',
    question: '唐制、宋制、明制婚服怎么选？',
    matchKeywords: ['唐制', '宋制', '明制', '形制', '选购'],
    fallbackChannel: 'xuan-gou-jue-ce',
  },
  {
    id: 'long-wen',
    question: '婚服上的龙纹有什么含义？',
    matchKeywords: ['龙纹', '纹样', '婚服', '龙'],
    fallbackChannel: 'wen-hua-leng-zhi-shi',
  },
  {
    id: 'li-yan',
    question: '为什么传统婚礼要用雁？',
    matchKeywords: ['纳采', '礼雁', '六礼', '雁'],
    fallbackChannel: 'hun-jia-liu-li',
  },
  {
    id: 'dynasty-mix',
    question: '不同朝代婚服有什么区别？',
    matchKeywords: ['形制', '朝代', '唐制', '宋制', '明制', '婚服'],
    fallbackChannel: 'xing-zhi-bai-ke',
  },
  {
    id: 'cui-zhuang',
    question: '催妆诗是什么？',
    matchKeywords: ['催妆', '唐代婚俗', '却扇'],
    fallbackChannel: 'hun-jia-liu-li',
  },
  {
    id: 'buy-or-rent',
    question: '汉服婚服买还是租？',
    matchKeywords: ['选购', '价格', '租赁', '买', '租'],
    fallbackChannel: 'jia-ge-zu-lin',
  },
];
