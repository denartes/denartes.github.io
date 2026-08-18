---
title: "Hello World 2: Electric Boogaloo"
description: "Why I built this site, why I chose GitHub and Astro, and how I've tried to tie everything together."
publishedDate: 2026-08-09
tags: ["meta", "site"]
draft: true
comments: true
---

Hello, World! Here we are again. This time I want to put a bit more effort into it and take some time to talk about the why and how behind this dev blog.

You may have noticed the slightly odd blend of a typical blog with code repository activity. While I will be blogging here, this is also where I want to document and share whatever interesting projects I'm working on. Think of it as a technical journal crossed with a dev portfolio, with a bit of chaotic fun while I explore new challenges and learn by doing.

A lot of the stuff I work on otherwise ends up scattered across GitHub repos, READMEs, notes and old conversations. Those are all useful in their own way, but I wanted somewhere I could actually talk about what I'm doing. There is usually a story behind why I built something, how I ended up approaching a problem, or why I made a particular decision that doesn't really have a place in the project itself.

There are also plenty of things I want to write about that aren't attached to a particular project. I've spent a lot of time playing around with different tools, platforms and ways of working, and occasionally I have enough thoughts about one of them that I'd like to put them somewhere. Writing about that stuff also forces me to actually organise my thoughts instead of leaving them floating around in my head.

I'm not planning to stick to a schedule or force myself to find things to write about. This is a hobby, and I want to keep it that way. I'll post when I have something I think is interesting enough to talk about and see where it goes from there.

## Why GitHub?

Is there a particular reason I chose GitHub Pages over something much more streamlined like WordPress or Blogger? Yes, and it stems from wanting an excuse to properly explore GitHub.

GitHub has obviously been part of my development workflow for a long time, but for the most part I've treated it as somewhere to keep Git repositories. Most of my experience with actually managing development work has been in Azure DevOps, where I'm much more comfortable with things like Boards, work items and pipelines.

I wanted to change that. GitHub has grown well beyond just hosting source code, and building this site gave me a real project where I could start using more of it instead of reading documentation or creating some throwaway test repository. I've always found I learn best by jumping in the deep end.

That meant using GitHub Pages for the site, GitHub Actions for building and deploying it, and eventually exploring Issues, Projects, Milestones and Releases as I started bringing my other projects into the site. Some of those concepts were familiar from Azure DevOps, while others took a little adjustment. GitHub's habit of calling almost everything an issue still feels a little strange to me.

It also seemed fitting for the site itself. Most of what I'm going to write about here is related in some way to things I'm building, and those things already live on GitHub. Having the site live there as well gives me plenty of opportunities to connect the two.

## Why Astro?

At first, I wasn't entirely sure how I wanted to go about building a blog on GitHub, or even what features I wanted it to have. I'm so used to building things with some form of database or backend functionality that working within the constraints of a static site was a little unfamiliar.

There was one key consideration that helped me decide though. I knew I wanted to use Markdown. It has become a standard for documentation, I already use it constantly in repositories, and writing posts as Markdown files means there isn't much ceremony involved when I want to add something.

My research led me to Jekyll and Astro, two common static site generators that work well with Markdown-based content. Jekyll was an obvious option for GitHub Pages and uses Liquid templates, which I was already familiar with from my Microsoft Power Pages work. The more I thought about what I wanted to do with the site though, the more Astro appealed to me.

Astro is component based, and I can easily bring in JavaScript when I actually need it. That gave me a lot more freedom to treat the site as something I could build rather than just a collection of Markdown pages wrapped in a template. I could keep the blog itself simple while still having proper components for projects, activity, roadmaps and whatever other ideas I come up with later.

The static side of Astro has also turned out to be a really good fit for GitHub Pages. The site gets built and deployed through GitHub Actions, and what ends up being served is just the generated site. I get to play around with the development side as much as I want without needing to run a server or maintain a backend just to publish a blog.

## The Design

Once I'd settled on Astro, I still had to figure out what I actually wanted the site to look like.

I knew fairly early that I didn't want the usual developer portfolio homepage with a giant introduction, a wall of technology logos and a carefully curated grid of projects. I'm not trying to sell a product here, and I don't expect people to randomly stumble onto the homepage and need to be convinced to stick around. Most people will probably arrive from one of my projects, GitHub, LinkedIn, or a link to a particular post.

I wanted the site to feel more like something you could browse. The blog is a big part of it, but projects should feel equally at home. If I've released something new, finished some work or written about a project, I want those things to naturally show up around the site without every page turning into a dashboard.

That thinking is where the activity side of the design came from. Code repository activity can look a little odd sitting next to blog posts, but I quite like that. It reflects what the site actually is. Sometimes the interesting thing I've done is write a post, and sometimes it's releasing a new version of something I've been working on.

I've kept the visual design fairly simple around that. I like having enough structure to make everything easy to find without filling every empty space just because I can. As I've added features, I've tried to keep them feeling like parts of the same site rather than a collection of GitHub widgets bolted onto a blog.

I'm sure I'll keep changing it. Half the fun of having my own site is that I can decide something annoys me one afternoon and completely redo it.

## Connecting Everything

This is probably the part that has changed the most since I first started building the site.

Originally I mostly needed somewhere to put posts and project pages, but once the projects were there I started thinking about how much information I was duplicating. If a project already has a repository, issues, releases and a roadmap on GitHub, I don't particularly want to maintain another version of all of that just so it can appear here, So I've started treating GitHub as the source for that information.

Issues are where the actual work lives. Milestones group those issues into planned releases, and Projects give me a board where I can organise and prioritise everything. When a version is finished, GitHub Releases becomes the record of what actually shipped.

That structure gives the site quite a lot to work with. A project page can show its planned roadmap using upcoming milestones. Releases can show what has already shipped. Meaningful completed work can appear as activity alongside posts and releases. The project page then becomes a useful view of what's happening without becoming another place I need to keep manually updated.

The blog fills in the part GitHub isn't particularly good at. An issue can tell me that I added a feature, and a release can tell me when it shipped, but neither is where I want to write a few thousand words about why I built the project in the first place or what I learned while doing it. That's what these posts are for.

I'm still figuring out exactly where the boundaries should be. I don't want every closed issue appearing on the homepage, and I don't want the site trying to recreate GitHub. The useful bits should surface here, while the detailed development work stays where it belongs.

I think that's the bit I like most about how the site has turned out so far. I can write here, build things on GitHub, manage the work around those things, and have it all gradually feed back into the same place.

And because I apparently needed another project to work on, the blog itself has now become one too.
```
