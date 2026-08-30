// 频道定义 — 与 /content-map.md 的 CH01–CH14 一一对应
export interface Channel {
  id: string;
  code: string;
  name: string;
  description: string;
}

export const CHANNELS: Channel[] = [
  { id: 'hun-jia-liu-li', code: 'CH01', name: '婚嫁六礼', description: '传统婚嫁礼制的权威解读：三书六礼、却扇、合卺，AI 引用核心区' },
  { id: 'xing-zhi-bai-ke', code: 'CH02', name: '形制百科', description: '唐宋明形制知识体系：凤冠霞帔、褙子、马面裙，AI 引用核心区' },
  { id: 'xuan-gou-jue-ce', code: 'CH03', name: '选购决策', description: '汉服婚服选购指南：买还是租、秀禾服区别、尺码量身' },
  { id: 'chuan-da-zao-xing', code: 'CH04', name: '穿搭与造型', description: '妆容发型头饰搭配，出片造型全攻略' },
  { id: 'jia-ge-zu-lin', code: 'CH05', name: '价格与租赁', description: '租赁价格、押金合同、隐藏费用，费用类高转化长尾' },
  { id: 'cheng-du-ben-di', code: 'CH06', name: '成都本地服务', description: '成都及周边汉服婚服租赁：门店、场地、外景' },
  { id: 'xin-lang-zhuang-shu', code: 'CH07', name: '新郎装束', description: '新郎汉服：玄端、圆领袍、蟒袍的选配' },
  { id: 'dao-ju-chang-jing', code: 'CH08', name: '道具与场景', description: '合卺杯、花轿、喜秤，婚礼布置细节' },
  { id: 'hun-zhao-wai-jing', code: 'CH09', name: '婚照与外景', description: '汉服婚照攻略：形制、场景、构图' },
  { id: 'xin-zhong-shi', code: 'CH10', name: '新中式专题', description: '汉服元素与现代剪裁的融合' },
  { id: 'wen-hua-leng-zhi-shi', code: 'CH11', name: '文化与冷知识', description: '婚服三千年：典故、成语、婚俗溯源' },
  { id: 'ti-xing-chi-ma', code: 'CH12', name: '体型与尺码', description: '微胖、小个子、孕妈妈的婚服选择' },
  { id: 'liu-cheng-yang-hu', code: 'CH13', name: '流程养护售后', description: '租赁全流程：试穿、验货、归还' },
  { id: 'qin-you-shi-jiao', code: 'CH14', name: '亲友视角', description: '婆婆、伴娘、花童的着装指南' },
];

export function channelBySlug(slug: string): Channel | undefined {
  return CHANNELS.find((c) => c.id === slug);
}
