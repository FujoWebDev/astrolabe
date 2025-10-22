# Astrolabe Adapters Starter

<div align="center">

TipTap documents in, Markdown, Bluesky, Leaflet (and many more) out...or
viceversa.

</div>

These adapters bundle a conversion layer for [TipTap's StarterKit
extension](https://tiptap.dev/docs/editor/extensions/functionality/starterkit#using-the-starterkit-extension).
Doing this, they provide both a proof of concept, and an initial set to begin
implementing practical support for multiple platform.

## Pick your adapter

- **[`@fujocoded/astdapters-mdast-starter`](./mdast/README.md)** — TipTap ⇆
  mdast bridge. Foundation for every other adapter.
- **[`@fujocoded/astdapters-bluesky-starter`](./bluesky/README.md)** — TipTap ⇆
  Bluesky Rich Text Lexicon.
- **[`@fujocoded/astdapters-leaflet-starter`](./leaflet/README.md)** — TipTap ⇆
  Leaflet Lexicon

## StarterKit Features

The features in [TipTap's StarterKit
extension](https://tiptap.dev/docs/editor/extensions/functionality/starterkit#using-the-starterkit-extension),
which are supported by these adapters. When a feature is not supported by the
destination platform, it's either dropped or "translated". You can use
plugins to change the translation mechanisms.

### Nodes

These are the "blocks" of the editor:

- Blockquote
- BulletList
- CodeBlock
- Document
- HardBreak
- Heading
- HorizontalRule
- ListItem
- OrderedList
- Paragraph
- Text

### Marks

These are the decoration on individual text elements:

- Bold
- Code
- Italic
- Link
- Strike
- Underline

## In these Packages

- **Starter Kit support:** Conversion to/from various format to the blocks
  and marks in StarterKit
- **Plugin system:** Implementation of `ConverterPlugin`s to handle new
  TipTap marks or nodes. All adapters support the same contract.
- **Storybook coverage:** Every adapter includes stories under its `stories/`
  folder to poke at and experiment with conversions in real time.

> [!TIP]
>
> The `addons/editor-tree-viewer` Storybook addon allows you to inspect
> inspect source JSON alongside mdast and platform outputs.

## Develop locally

```bash
pnpm build               # compile converters
pnpm dev                 # watch + rebuild during development
cd adapters/adapter-starter/mdast && pnpm test  # run targeted tests
```
