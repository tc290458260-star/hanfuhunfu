import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// hanfuhunfu.com — 汉服婚服知识站
// 部署：构建产物 dist/ 由服务器 Nginx 托管（域名分流已就绪）
export default defineConfig({
  site: 'https://hanfuhunfu.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
