# Denartes

Personal website and developer blog. Built with [Astro](https://astro.build).

**Live site:** [denartes.github.io](https://denartes.github.io)

## Project Structure

```
├── public/
│   ├── images/           # Static images
│   └── favicon.svg       # Site favicon
├── src/
│   ├── components/       # Reusable Astro components
│   ├── content/
│   │   ├── blog/         # Blog posts (Markdown/MDX)
│   │   └── projects/     # Project pages (Markdown/MDX)
│   ├── layouts/          # Page layouts
│   ├── pages/            # File-based routing
│   └── styles/           # Global CSS
├── astro.config.mjs      # Astro configuration
├── package.json
└── tsconfig.json
```

## Local Development

### Prerequisites

- Node.js 20 or later
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production site |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run Astro diagnostics |

## Adding Content

### Adding a Blog Post

1. Create a new Markdown file in `src/content/blog/`:

```markdown
---
title: "Your Post Title"
description: "A brief description of the post."
publishedDate: 2026-07-25
tags: ["topic", "another-topic"]
draft: false
---

Your content here...
```

2. The post will automatically appear on the blog index and homepage.

### Blog Post Frontmatter

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `description` | Yes | Brief description (used in lists and SEO) |
| `publishedDate` | Yes | Publication date (YYYY-MM-DD) |
| `updatedDate` | No | Last update date |
| `tags` | No | Array of topic tags |
| `draft` | No | Set to `true` to hide in production |
| `project` | No | Associated project ID |
| `coverImage` | No | Path to cover image |
| `coverAlt` | No | Alt text for cover image |
| `canonicalUrl` | No | Canonical URL if cross-posted |
| `series` | No | Series name for multi-part posts |
| `seriesOrder` | No | Position in series |

### Adding a Project

1. Create a new Markdown file in `src/content/projects/`:

```markdown
---
name: "Project Name"
shortDescription: "One-line description."
status: "active"
technologies: ["TypeScript", "Astro"]
featured: false
startDate: 2026-01-01
---

Full project description...
```

2. The project will appear on the projects index.

### Project Frontmatter

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Project name |
| `shortDescription` | Yes | One-line description |
| `status` | Yes | `active`, `maintained`, `archived`, `experimental`, or `planned` |
| `startDate` | Yes | Project start date |
| `technologies` | No | Array of technologies used |
| `repositoryUrl` | No | GitHub repository URL |
| `productUrl` | No | Live product/website URL |
| `docsUrl` | No | Documentation URL |
| `featured` | No | Set to `true` to highlight on homepage |
| `lastUpdated` | No | Last significant update |
| `logo` | No | Path to project logo |
| `screenshots` | No | Array of screenshot paths |

### Using Drafts

Set `draft: true` in any blog post's frontmatter to hide it from production builds. Drafts are visible during development (`npm run dev`).

### Adding Images

1. Place images in `public/images/`.
2. Reference them in Markdown:

```markdown
![Alt text](/images/your-image.png)
```

For content collection images (cover images, logos), place them alongside the content file and reference with a relative path.

## Building for Production

```bash
# Run checks and build
npm run build

# Preview the build locally
npm run preview
```

The built site is output to `dist/`.

## Deployment

The site deploys automatically to GitHub Pages when changes are pushed to `main`.

### Manual Deployment

1. Push to the `main` branch.
2. GitHub Actions will build and deploy automatically.
3. The workflow runs Astro checks before building.

### Workflow

The deployment workflow (`.github/workflows/deploy.yml`):

1. Checks out the repository
2. Installs dependencies
3. Runs `npm run check`
4. Builds the site
5. Deploys to GitHub Pages

## Configuration

### Site URL

The production URL is configured in `astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://denartes.github.io',
  // ...
});
```

### Syntax Highlighting

Code blocks use the `github-dark` theme. Configure in `astro.config.mjs`:

```javascript
markdown: {
  shikiConfig: {
    theme: 'github-dark',
    wrap: true,
  },
},
```

## License

Content and code are copyright. See individual project pages for open source project licenses.
