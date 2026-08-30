// 频道定义 — 与 /content-map.md 的 CH01–CH14 一一对应
export interface Channel {
  id: string;
  code: string;
  name: string;
  description: string;
}

export const CHANNELS: Channel[] = [
  { id: 'hun-jia-liu-li', code: 'CH01', name: '婚嫁六礼', description: '传统婚嫁礼仪的由来、仪式与文化语境。' },
  { id: 'xing-zhi-bai-ke', code: 'CH02', name: '形制百科', description: '从唐宋到明代，认识不同婚服的形制与结构。' },
  { id: 'xuan-gou-jue-ce', code: 'CH03', name: '选购决策', description: '从婚礼场景、体型和需求出发，选择合适的婚服。' },
  { id: 'chuan-da-zao-xing', code: 'CH04', name: '穿搭与造型', description: '婚服、发型、头饰与整体造型的搭配方法。' },
  { id: 'jia-ge-zu-lin', code: 'CH05', name: '价格与租赁', description: '了解婚服租赁价格、押金、合同与常见费用。' },
  { id: 'cheng-du-ben-di', code: 'CH06', name: '成都本地服务', description: '成都及周边婚服租赁、试衣、场地与实际服务参考。' },
  { id: 'xin-lang-zhuang-shu', code: 'CH07', name: '新郎装束', description: '认识传统新郎服饰及其与新娘婚服的搭配。' },
  { id: 'dao-ju-chang-jing', code: 'CH08', name: '道具与场景', description: '合卺杯、喜秤、团扇等婚礼器物与场景应用。' },
  { id: 'hun-zhao-wai-jing', code: 'CH09', name: '婚照与外景', description: '传统婚服拍摄、场景选择与婚照搭配参考。' },
  { id: 'xin-zhong-shi', code: 'CH10', name: '新中式专题', description: '传统婚服元素与现代婚礼审美的结合。' },
  { id: 'wen-hua-leng-zhi-shi', code: 'CH11', name: '文化与冷知识', description: '婚服典故、纹样寓意、历史来源与文化知识。' },
  { id: 'ti-xing-chi-ma', code: 'CH12', name: '体型与尺码', description: '不同身形、身高与尺码条件下的婚服选择。' },
  { id: 'liu-cheng-yang-hu', code: 'CH13', name: '流程养护售后', description: '婚服试穿、租赁、归还、清洁与养护知识。' },
  { id: 'qin-you-shi-jiao', code: 'CH14', name: '亲友视角', description: '伴娘、伴郎、父母与亲友服饰的搭配参考。' },
];

export function channelBySlug(slug: string): Channel | undefined {
  return CHANNELS.find((c) => c.id === slug);
}
