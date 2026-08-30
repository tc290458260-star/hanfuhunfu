import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 内容集合：审核通过的文章由审核后台写入 content/articles/<channel>/<slug>.md
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    channel: z.string(),
    level: z.enum(['S', 'A', 'B']),
    keywords: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    source: z.enum(['manual', 'deepseek']).default('manual'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
