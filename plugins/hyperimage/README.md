# @fujocoded/astrolabe-hyperimage

## What is `@fujocoded/astrolabe-hyperimage`?

A TipTap image extension that handles paste and drop, shrinks previews so big photos do not bloat the document, and keeps the originals around for publish time.

## What's included in `@fujocoded/astrolabe-hyperimage`?

- `Plugin`: the TipTap extension to register on your editor
- `createIndexedDBBlobStore` and `createInMemoryBlobStore` (from `/storage`): two backends for storing original, non-resized images. IndexedDB persists across sessions (or does its best to), in-memory does not.
- Default styles (from `/css`)

## What can you do with `@fujocoded/astrolabe-hyperimage`?

- Drag a bunch of screenshots into the editor and have them appear inline
- Copy/paste Gifs(!) into the editor and have them still animate (!!!)
- Paste a 5MB phone photo and let the document carry a small preview, while the original sits in IndexedDB (the browser's local database) for upload at publish time
- Reload the page to find your originals still ready to publish at full
  quality—or, well, "most likely find them" (the plugin does its best 🤞)!

## Setup

1. Run the following command:

   ```bash
   pnpm add @fujocoded/astrolabe-hyperimage
   ```

2. Register the extension on your editor and pass it a storage:

   ```tsx
   import { EditorProvider } from "@tiptap/react";
   import StarterKit from "@tiptap/starter-kit";
   import { Plugin as Hyperimage } from "@fujocoded/astrolabe-hyperimage";
   import { createIndexedDBBlobStore } from "@fujocoded/astrolabe-hyperimage/storage";
   import "@fujocoded/astrolabe-hyperimage/css";

   <EditorProvider
     extensions={[
       StarterKit,
       Hyperimage.configure({
         storage: createIndexedDBBlobStore(),
         documentId: post.id,
       }),
     ]}
   />;
   ```

`storage` is required. Pass `createInMemoryBlobStore()` for tests or pages where you do not need originals to outlive the tab.

## Okay how do I _actually_ do stuff with this?

See the story files in `stories/`:

- `HyperImage.stories.tsx`: paste, drop, and a panel that shows what is in storage

## Configuring `Hyperimage`

- `storage` (required): an `ImageBlobStore` that keeps original blobs.
  - `createIndexedDBBlobStore()` => persists across sessions, survives reloads
  - `createInMemoryBlobStore()` => lives for the lifetime of the page
- `documentId` (optional): a string tag for every original stored from this editor. When you reopen the same draft, originals tagged with this id survive cleanup. When omitted, a fresh session id is generated each load and old originals get swept by the TTL.
- `imageOptions` (optional): preview-pass settings. Defaults shown.
  - `maxWidth: 800` => wider images get resized down to this many pixels
  - `maxSizeBytes: 512000` => larger files get re-encoded to JPEG
  - `quality: 0.85` => JPEG quality (0–1) for re-encoded previews
  - `storagePolicy: "when-resized"` => when to keep the original blob
    - `"when-resized"` keeps it only when the preview differs from the original
    - `"always"` keeps every paste
    - `"never"` skips storage

## Two attributes you may care about

The extension writes two attributes onto every image node:

- `isPreview`: serialized to HTML. `true` means the embedded `src` is a shrunk or re-encoded preview, not the original.
- `originalMissing`: runtime-only, never serialized. Set to `true` when a preview's original is no longer in storage. Read this if you want to warn the user that publishing will use preview quality.

## Storage is best-effort

The store can lose originals between sessions for a few normal reasons:

- Another tab ran cleanup while this one was idle
- The browser evicted site data due to storage need
- The TTL sweep crossed with a long absence
- IndexedDB was blocked, unavailable, or full
- The user cleared site data

None of these break display or document integrity. They simply mean the uploaded image will be the "preview" rather than the "original". If you need a hard guarantee, upload the original to your own durable storage at paste time instead of relying on this cache.

## Development

```bash
pnpm build   # Compile plugin
pnpm dev     # Watch mode
pnpm test    # Run tests
```
