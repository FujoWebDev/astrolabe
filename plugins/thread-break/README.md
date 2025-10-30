# Thread Break Plugin

A TipTap extension for inserting thread break markers with platform-specific configuration.

## Features

- Insert thread break markers in your content
- Configure per-platform behavior (skip or break)
- Visual popover editor for platform settings
- Keyboard shortcut: `Mod-Enter`

## Installation

```bash
pnpm add @fujocoded/astrolabe-thread-break
```

## Usage

```typescript
import { Plugin as ThreadBreak } from "@fujocoded/astrolabe-thread-break";
import "@fujocoded/astrolabe-thread-break/css";

const editor = useEditor({
  extensions: [
    ThreadBreak.configure({
      skipOn: ["mastodon", "tumblr"],
      breakOn: ["bsky", "twitter"],
    }),
  ],
});
```

## Platform Configuration

Each thread break can be configured to either "skip" or "break" on different platforms:

- **Skip**: The thread continues on this platform
- **Break**: The thread breaks into a new post on this platform

Default platforms: `mastodon`, `tumblr`, `bsky`, `twitter`

## Exports

- `"."` - Main plugin
- `"./css"` - Stylesheet
- `"./popover"` - Standalone popover component
- `"./adapter"` - Conversion utilities for mdast and AtProto

## Adapters

The thread-break plugin includes adapter functions for converting to different formats:

### Markdown (mdast)

```typescript
import { toMdastNode } from "@fujocoded/astrolabe-thread-break/adapter";
import { convert } from "@fujocoded/astdapters-mdast-starter";

const mdastTree = convert(editorJson, { plugins: [toMdastNode] });
```

Thread breaks are converted to horizontal rules (`---`) in markdown.

### Bluesky (AtProto)

```typescript
import { toThreadBreakText } from "@fujocoded/astrolabe-thread-break/adapter";
import { convert } from "@fujocoded/astdapters-bluesky-starter";

const richText = await convert(editorJson, {
  jsonDocPlugins: [toThreadBreakText],
});
```

Thread breaks are converted to double newlines (`\n\n`) in the plain text representation.
