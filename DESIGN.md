# Astrolabe: an editor for fandom

> Astrolabe: an ancient, handheld model of the universe with a wide range of applications, including the navigation of ships.

## Overview

> [!WARNING]
> This design doc is aspirational and might not represent what is currently possible with the editor.

> [!NOTE]
> Some of the goals outlined in this document might be best achieved outside of Astrolabe itself, possibly as independent
> libraries that are editor-agnostic. As always, identifying and outlining the problems and goals is important, but so
> is being open to discovering alternative–hopefully better!–solutions to them.

This document describes the overarching goal of a Rich Text Editor (RTE) for web applications. The editor should:

- Offer a basic set of out-of-the-box plugins for modern content creation experiences. Examples include: gif selectors, spoilers/content warnings on both text and block elements, custom emojis, mentions, embeds, and tumblr-style "photosets".
- Be extensible and customizable, and support presets that make it possible to create custom experiences for existing software. For example, projects should be able to restrict available plugins to "those that can emit markdown supported by GitHub" or "those whose output is compatible with Tumblr".
- Supports semantic output that can be further processed and built upon to allow compatibility and interoperability with (and extension by) other projects.

In particular, we'll develop the core set of plugins and semantic schemas with an a eye to the needs for online self-expression of transformational fandom.

## Motivation

1. **There is no existing "out of the box" editor that enables plug-and-play, modern editing experiences.** Examples of missing features include: tumblr-style photosets, custom emojis, advanced image editing (e.g. cropping images before upload), or embedding content from external websites. This is a huge barrier for incumbent social software projects (since they need to reimplement this functionality from scratch), and for the migration of users across projects (since they may lose features that are essential to their self expression).

2. **There is no semantic standard to express concepts that are a fundamental part of _modern_ communication on the web.** While HTML can represent things like headers, textual emphasis, or images (among others), there's no representation for concepts like "image with content warnings", "custom emoji" or "galleries". This semantic void makes transferring content across projects an inevitably-lossy (and herculean) effort, and restricts how external consumers are able to interact with content across sites.
3. **There is no widely-available visual editor that supports the [MDX file format](https://mdxjs.com/).** At present, the MDX format is establishing itself as a widespread, portable format for content creation on the web, and is supported out of the box by many existing frameworks. Paired with the wider [UnifiedJS ecosystem](https://unifiedjs.com/), MDX provides a format that is both human and machine readable, with an vast ecosystem of plugins to both extend its capabilities and manipulate its output.

### Relationship with "Boba Editor Next"

Boba Editor Next is a a proof of concept and initial implementation of the design proposed in this document. Given that the current "Boba Editor" needs to be sunset quickly, this document will discuss any tradeoff necessary for its short-term launch.

## Intended use cases

While Astrolabe can be used as a standalone editor within a single project, ensuring compatibility with different input/output formats must be a core part of its design.

### RSS/ActivityPub (Output)

Content created with Astrolabe should support output in a format compatible with RSS and ActivityPub.

When a 1:1 representation of the output of a plugin is not possible, fallback representation should be provided. If supported by the protocol, the fallback representation should include extra semantic data that allows to reconstruct the original output.

### RSS/ActivityPub (Input)

Astrolabe should allow loading data as provided by a RSS item or ActivityPub message, with a best effort conversion. If extra semantic data is present and supported by an installed plugin, Astrolabe should attempt to reconstruct the original state.

### Rich Text Editor interface to MDX-based Content Management Systems (CMS)

[MDX](https://mdxjs.com/) is a human-readable format that is gaining wide adoption in the CMS space. Publicized as "Markdown for the component era", MDX allows users to combine Markdown content with [JSX](https://mdxjs.com/docs/what-is-mdx/#jsx), so they can embed custom HTML and advanced components within their content, while maintaing the ability to modify it through simple text editors. MDX is supported by many popular frameworks, including [Astro](https://astro.build/), [NextJS](https://nextjs.org/), [Gatsby](https://www.gatsbyjs.com), and [Docusaurus](https://docusaurus.io). GitHub is also currently experimenting with [interactive, MDX-based READMEs](https://twitter.com/FredKSchott/status/1590438076677238784?s=20&t=o7oCeQxbq2ytbc1hc4JoyQ).

In our experiementation within Fandom Coders, MDX has been widely appreciated by fandom folks as a format for creating portable online content. But while it is possible for people to write MDX on any textual editor, more widespread and casual usage will require the ability to also modify the content through a rich (and mobile-friendly) interface.

> TODO: embed/link to research on similar, existing usage of MDX as an output format for visual editor.

### Crossposting

With the proliferation of multiple online platforms (and the current push towards decentralization), it will be more and more important to enable crossposting the same content across different services, or creating custom interfaces compatible with existing ones.

For example, it should be possible to use Astrolable to create a BobaBoard contribution and extract a "GitHub-compatible" view of it, which can then be posted as an issue on GitHub. The actual posting mechanism (i.e. authentication handling and calls to the publish APIs) is out of scope for this project.

#### Independent conversion across different formats

While the core use case of Astrolabe is the editor itself, it should be possible to leverage the associated plugin ecosystem to convert between each available input and output format, even if no intermediate visual editing is needed.
