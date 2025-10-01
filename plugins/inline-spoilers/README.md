# @fujocoded/astrolabe-inline-spoilers

A plugin to create inline spoilers in a TipTap editor. Part of
Astrolabe.

## Structure

This plugin is made of 3 packages:

- `@fujocoded/astrolabe-inline-spoilers`: the plugin itself
- `@fujocoded/astrolabe-inline-spoilers/button`: a default button for the plugin
- `@fujocoded/astrolabe-inline-spoilers/css`: a default CSS for the plugin

## Sample usage

```tsx
import {
  EditorProvider,
  BubbleMenu,
  type EditorProviderProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { InlineSpoilersPlugin } from "@fujocoded/astrolabe-inline-spoilers";
import { InlineSpoilersButton } from "@fujocoded/astrolabe-inline-spoilers/button";
import "@fujocoded/astrolabe-inline-spoilers/css";

<EditorProvider
  extensions={[StarterKit, InlineSpoilersPlugin]}
  content={`<p>Some <span data-type='inline-spoilers' data-visible='false'>spoilered</span> text</p>`}
>
  <BubbleMenu editor={null}>
    <InlineSpoilersButton />
  </BubbleMenu>
</EditorProvider>;
```
