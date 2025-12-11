# @fujocoded/astdapters-mdast-starter

Converts between TipTap and mdast. Foundation for all platform adapters.

## Overview

Converts between TipTap's JSON document format and [mdast](https://github.com/syntax-tree/mdast) (Markdown Abstract Syntax Tree). All other adapters (Bluesky, Leaflet, etc.) build on this foundation.

## Features

- **StarterKit support**: Supports all TipTap StarterKit nodes and marks
- **Plugin system**: Extend with custom nodes, marks, and tree transforms
- **Async pipeline**: Tree transforms can be async for image processing, API calls, etc.
- **Tree transformation**: Pre/post-conversion tree manipulation

## Usage

### Basic Conversion

```tsx
import { convert } from "@fujocoded/astdapters-mdast-starter";

// TipTap to mdast (async)
const { trees, context } = await convert(editor.getJSON());

// With plugins
const { trees, context } = await convert(editor.getJSON(), {
  plugins: [customNodePlugin, treeTransformPlugin],
});
```

### With React Hook

```tsx
import { useEditorToMdast } from "@fujocoded/astdapters-mdast-starter/helpers/useEditorToMdast";

// Must be used inside EditorProvider context
function MyComponent() {
  const mdastTree = useEditorToMdast([
    /* plugins */
  ]);

  return <pre>{JSON.stringify(mdastTree, null, 2)}</pre>;
}
```

## Plugin System

There are 3 types of plugins:

- **Node Converter (`pluginType: "converter-node"`):** Handles custom TipTap to produce mdast nodes (for example `image` nodes for images).
- **Mark Converter (`pluginType: "converter-mark"`):** Handles TipTap marks, wrapping or transforming inline content (e.g. `strong`, `emphasis`).
- **Tree Transform (`pluginType: "tree-transform"`):** Operates on the whole tree, with support for async processing. Each plugin runs in one of two phases:
  - `phase: "pre"`: operates on TipTap JSON before conversion and other plugins
  - `phase: "post"` operates on mdast trees after conversion. Useful for structural changes, normalization, or extracting assets.

### Node Converter Plugin

Handles custom TipTap nodes:

```tsx
import type { ConverterPlugin } from "@fujocoded/astdapters-mdast-starter";

const myNodePlugin: ConverterPlugin = {
  pluginType: "converter-node",
  handlesNode: (node) => node.type === "myCustomNode",
  convert: (node, context) => ({
    type: "html",
    value: `<custom-element>${node.attrs.content}</custom-element>`,
  }),
};
```

### Mark Converter Plugin

Handles custom TipTap marks:

```tsx
import type { ConverterMarkPlugin } from "@fujocoded/astdapters-mdast-starter";

const myMarkPlugin: ConverterMarkPlugin = {
  pluginType: "converter-mark",
  handlesMark: (mark) => mark.type === "myCustomMark",
  convert: (mark, node, currentNode, context) => ({
    type: "strong",
    children: [currentNode],
  }),
};
```

### Tree Transform Plugin

Transform entire document trees (pre or post-conversion):

```tsx
import type { TreeTransformPlugin } from "@fujocoded/astdapters-mdast-starter";

// Pre-transform: operates on TipTap JSON
const preTransform: TreeTransformPlugin = {
  pluginType: "tree-transform",
  phase: "pre",
  transform: (tree, context) => {
    // Modify TipTap JSON before conversion
    return tree;
  },
};

// Post-transform: operates on mdast
const postTransform: TreeTransformPlugin = {
  pluginType: "tree-transform",
  phase: "post",
  transform: async (trees, context) => {
    // Can be async! Extract images, call APIs, etc.
    const processedTrees = await Promise.all(
      trees.map(async (tree) => {
        // Process tree asynchronously
        return tree;
      })
    );
    return processedTrees;
  },
};
```

## Async Pipeline

The mdast pipeline supports async operations via tree transform plugins:

```tsx
const asyncPlugin: TreeTransformPlugin = {
  pluginType: "tree-transform",
  phase: "post",
  transform: async (trees, context) => {
    // Process trees asynchronously
    await Promise.all(trees.map((tree) => processTree(tree)));
    return trees;
  },
};

const { trees } = await convert(editor.getJSON(), {
  plugins: [asyncPlugin],
});
```

## Development

```bash
pnpm build                                   # Compile adapter
pnpm dev                                     # Watch mode
pnpm test                                    # Run tests
```

## See Also

- [Bluesky Adapter](../bluesky/README.md) - Built on mdast
- [Leaflet Adapter](../leaflet/README.md) - Built on mdast
