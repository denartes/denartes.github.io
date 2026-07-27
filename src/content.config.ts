import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      project: z.string().optional(),
      coverImage: image().optional(),
      coverAlt: z.string().optional(),
      canonicalUrl: z.string().url().optional(),
      series: z.string().optional(),
      seriesOrder: z.number().optional(),
      comments: z.boolean().default(true),
    }),
});

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      shortDescription: z.string(),
      status: z.enum(['active', 'maintained', 'archived', 'experimental', 'planned']),
      repositoryUrl: z.string().url().optional(),
      productUrl: z.string().url().optional(),
      docsUrl: z.string().url().optional(),
      technologies: z.array(z.string()).default([]),
      logo: image().optional(),
      screenshots: z.array(image()).optional(),
      featured: z.boolean().default(false),
      startDate: z.coerce.date(),
      lastUpdated: z.coerce.date().optional(),
    }),
});

export const collections = {
  blog,
  projects,
};
