# Boba Editor Next

<div align="center">

![BEN meme](./BEN.png)

Next-generation editor for BobaBoard (and beyond). Still in experimental phase. Name subject to change.

<!-- Add the <a> so IMGs will stay on the same line -->
<a href="#">
    <img alt="GitHub" src="https://img.shields.io/github/license/essential-randomness/boba-editor-next" />
</a>
<a href="https://gitpod.io/from-referrer/">
    <img src="https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod" alt="Gitpod Ready-to-Code"/>
</a>
<a href="https://fancoders.com/">
    <img src="https://img.shields.io/badge/fandom-coders-ff69b4" alt="Fandom Coders badge"/>
</a>
</div>

## Motivation

1. **There is no existing "out of the box" editor that enables plug-and-play, modern editing experiences.** Examples of missing features include: tumblr-style photosets, custom emojis, advanced image editing (e.g. cropping images before upload), or embedding content from external websites. This is a huge barrier for incumbent social software projects (since they need to reimplement this functionality from scratch), and for the migration of users across projects (since they may lose features that are essential to their self expression).

2. **There is no semantic standard to express concepts that are a fundamental part of _modern_ communication on the web.** While HTML can represent things like headers, textual emphasis, or images (among others), there's no representation for concepts like "image with content warnings", "custom emoji" or "galleries". This semantic void makes transferring content across projects an inevitably-lossy (and herculean) effort, and restricts how external consumers are able to interact with content across sites.
3. **There is no widely-available visual editor that supports the [MDX file format](https://mdxjs.com/).** At present, the MDX format is establishing itself as a widespread, portable format for content creation on the web, and is supported out of the box by many existing frameworks. Paired with the wider [UnifiedJS ecosystem](https://unifiedjs.com/), MDX provides a format that is both human and machine readable, with an vast ecosystem of plugins to both extend its capabilities and manipulate its output.

## Run Locally

### Regular development

Start Storybook

```bash
  yarn run storybook
```

### Output Inspector Storybook extensions

Build extension

```bash
yarn run build:output-inspector
```

Run Storybook without manager cache, to pick up the changes. This is only necessary the first time after compilation.

```bash
yarn run storybook --no-manager-cache
```

## Contributing

Contributions are always welcome! Please contact Ms Boba for details.
