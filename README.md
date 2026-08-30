# 汉服婚服网（hanfuhunfu.com）整站重构

> 中国汉服婚服第一知识网站 → AI 搜索内容源头 → 品牌赋能 + 后期广告变现。
> 运营方：四川盛世天赐文化传播有限公司 · 天赐华裳（成都武侯区大合仓·星商界4栋2单元11楼1104）

## 目录结构

```
hanfuhunfu/
├── content-map.md        # 内容地图 v1：选题 / 14 频道 / S·A·B 分级（生成管线的燃料）
├── hanfu-lexicon.json    # 形制术语校验词表（质检红线：block / warn / prefer 三级）
├── .env                  # 环境变量（不进 Git）：DEEPSEEK_API_KEY / REVIEW_TOKEN / WECOM_WEBHOOK
├── generator/            # 内容生成器（B 模式：cron 调 DeepSeek 批量生成）
│   ├── generate.js       # 解析内容地图 → 注入词表事实基准 → 生成 → 提交审核队列
│   └── state.json        # 已生成选题记录（不进 Git，防重复生成）
├── site/                 # Astro 静态站点（SSG）
│   └── src/content/articles/<channel>/*.md   # 已发布内容库（审核通过后自动写入）
└── review/               # 审核后台 MVP（零依赖 Node，职责：待审列表/预览/通过驳回）
    ├── server.js         # HTTP 服务 + API（必须鉴权）
    ├── lexicon.js        # 形制词表校验模块（block 拦截 / prefer 自动替换 / prompt 事实基准注入）
    ├── wecom.js          # 企微群机器人推送（审核提醒）
    ├── store.js          # JSON 文件存储（量大后换 SQLite）
    └── public/index.html # 手机 H5 审核页（token 鉴权，高亮 warn 段落）
```

## 内容管线（目标闭环）

```
内容地图选题 → 凌晨3点 cron 调 DeepSeek 生成（prompt 注入词表事实基准）
  → 提交 review 后台（POST /api/articles）
  → 词表质检：block 直接驳回回流 / prefer 自动替换 / warn 标记人工必读
  → 早9点企微机器人推送审核提醒
  → 老板手机 H5 审核：通过 / 驳回（一句话原因，回流重生成）
  → 通过 → 写入 site/src/content/articles/<channel>/<slug>.md
  → git commit & push → 站点构建 → 发布 + sitemap 提交
  → 收录/AI引用监测 → 缺口回流选题库
```

S 级内容（约10%，婚服百科/六礼/形制对比等 AI 引用锚点页）由 WorkBuddy 会话精产，不走批量生成。

## 本地开发

```bash
# 站点
cd site && npm install && npm run dev      # http://localhost:4321
npm run build                              # 产物 dist/，服务器 Nginx 托管

# 审核后台
cd review && REVIEW_TOKEN=你的口令 node server.js   # http://localhost:3001
# 推送提醒（可选）：环境变量 WECOM_WEBHOOK=企微群机器人地址

# 内容生成（需先启动 review 后台；配置在根目录 .env）
cd generator
node generate.js --id B102                        # 生成指定选题
node generate.js --count 3 --level B              # 批量 3 篇 B 级（跳过已生成）
node generate.js --count 2 --level A --channel CH01  # 限定频道
# block 级违规自动带质检反馈回流重生成一次；仍违规则报告失败
# 服务器 cron：凌晨 3 点批量生成（闲时价），早 9 点 POST /api/push-digest 推送审核提醒
```

## 部署要点（腾讯云 CVM，Nginx 已统一分流）

- `site/dist/` → Nginx 静态托管 hanfuhunfu.com；构建产物建议 git push 后服务器拉取构建，或 GitHub Actions
- `review/` → 监听内网端口（默认 3001），Nginx 反代到 `audit.hanfuhunfu.com` 或路径下，`REVIEW_TOKEN` 必须改掉默认值
- API key（DeepSeek / 混元）只走服务器环境变量，不进代码仓库

## 两条红线

1. **形制术语**：所有生成内容发布前必须过 `hanfu-lexicon.json` 校验（圈内对形制错误零容忍）
2. **图片版权**：配图仅三个来源——门店实拍（最优）、混元生图、代码绘制 SVG 示意图；不爬网图

## 质检规则分级

| 级别 | 行为 | 示例 |
|---|---|---|
| block | 不进审核队列，自动驳回回流 | "唐制凤冠霞帔"（凤冠霞帔定型于明）、"秀禾服属于汉服" |
| warn | 进队列但审核页高亮人工必读 | "红男绿女"未加限定语、大袖衫裸写不带朝代 |
| prefer | 自动替换后复检 | 齐胸襦裙→齐胸衫裙、狄髻→鬏髻 |

## 下一步

- [x] 生成脚本：`generator/generate.js`（DeepSeek deepseek-v4-flash，词表事实基准注入，block 回流重试）
- [ ] 审核通过后 git commit 自动化 + 站点构建发布 + sitemap 提交
- [ ] 企微机器人 webhook 配置（建群加机器人即可，免认证）
- [ ] S 级 22 篇精产（从 content-map.md 的 S 选题开始）
- [ ] 图床接入腾讯云 COS
