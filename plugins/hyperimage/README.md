# @fujocoded/astrolabe-hyperimage

A TipTap extension that extends the base image plugin with:

- paste/drop support
- [more to come, like "resize preview so it doesn't kill your browser"]

## Features

- **Paste & Drop**: Drag images into editor or paste from clipboard

## Structure

- `@fujocoded/astrolabe-hyperimage`: Core plugin
- `@fujocoded/astrolabe-hyperimage/css`: Default CSS styles
- TODO: maybe export plugins on their own?

## Usage

```tsx
import { EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Plugin as HyperimagePlugin } from "@fujocoded/astrolabe-hyperimage";
import "@fujocoded/astrolabe-hyperimage/css";

<EditorProvider
  extensions={[StarterKit, HyperimagePlugin]}
  content={`<figure data-astrolb-type="hyperimage"><img src="path/to/image.png"></img></figure>`}
/>;
```

## Development

```bash
pnpm build                              # Compile plugin
pnpm dev                                # Watch mode
```
