import { expect, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { type EditorProviderProps } from "@tiptap/react";
import { Plugin as HyperImage } from "../src/Node.js";
import "../src/hyperimage.css";
import {
  withEditorTreeViewer,
  type EditorTreeViewConfig,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";
import { blobToDataURL, createIndexedDBBlobStore } from "../src/storage";
import {
  debugStore,
  refreshPanel,
  withStorageDebugPanel,
} from "./StorageDebugPanel";
import { IndexedDBBlobStore } from "../src/storage/indexed-db-store";

import Robbie from "./assets/robbie.small.png";
import Sportacus from "./assets/sportacus.small.png";
import SurpriseGif from "./assets/surprise.gif";
import GhostPreview from "./assets/ghost-preview.jpg";
import RestoredPreview from "./assets/restored-preview.jpg";

const restoredOriginalStore = new IndexedDBBlobStore();
const deleteFigureStore = new IndexedDBBlobStore();
const restoredOriginalScopeId = "hyperimage-story-restored-original";
const restoredOriginalId = "restored-1";

async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}

function getHyperImageFigures(canvasElement: HTMLElement): HTMLElement[] {
  return Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      ".astrolabe-editor figure[data-astrolb-type='hyperimage']",
    ),
  );
}

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "json",
    label: "JSON",
    compute: async ({ editorJson }) => {
      return {
        type: "json",
        content: editorJson as unknown as Record<string, unknown>,
      };
    },
  },
  {
    id: "stored-images",
    label: "Stored Originals",
    compute: async () => {
      const storedRows = await debugStore.listAll();
      const images: Record<string, { metadata: unknown; preview: string }> = {};

      for (const stored of storedRows) {
        const dataUrl = await blobToDataURL(stored.blob);
        images[stored.id] = {
          metadata: stored.metadata,
          preview: dataUrl.slice(0, 100) + "...",
        };
      }

      return {
        type: "json",
        content: {
          storedCount: storedRows.length,
          images,
        } as Record<string, unknown>,
      };
    },
  },
];

const meta = {
  title: "Astrolabe/HyperImage",
  parameters: {
    layout: "padded",
    editorTreeViewer: {
      editorTreeViews,
    },
  },
  args: {
    // @ts-expect-error - need to add this to the global args
    plugins: [
      HyperImage.configure({
        storage: createIndexedDBBlobStore(),
      }),
    ],
  },
  decorators: [withEditorTreeViewer],
  component: () => null,
} satisfies Meta<EditorProviderProps & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    initialText: `<figure data-astrolb-type="hyperimage"><img src="${Sportacus}"></img></figure>`,
  },
  play: async ({ canvasElement }) => {
    const container = canvasElement;
    const image = container.querySelector("img");
    await expect(image).toBeTruthy();
  },
};

export const WithAltText: Story = {
  args: {
    initialText: `<figure data-astrolb-type="hyperimage"><img src="${Sportacus}" alt="A sample test image"></img></figure>`,
  },
};

export const MultipleImages: Story = {
  args: {
    initialText: `
      <figure data-astrolb-type="hyperimage"><img src="${Sportacus}" alt="Sportacus"></img></figure>
      <p>Some text between images</p>
      <figure data-astrolb-type="hyperimage"><img src="${Robbie}" alt=""></img></figure>
      <p>More text</p>
      <figure data-astrolb-type="hyperimage"><img src="${Sportacus}" alt="Another image"></img></figure>
    `,
  },
};

export const ViewOnly: Story = {
  args: {
    initialText: `<figure data-astrolb-type="hyperimage"><img src="${Sportacus}" alt="View-only image"></img></figure>`,
    editable: false,
  },
};

export const PasteImage: Story = {
  args: {
    initialText: `<p>This example will automatically paste an image! Try to paste your own too!</p><p></p>`,
  },
  play: async ({ canvasElement }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File([await urlToBlob(Robbie)], "robbie.small.png", {
        type: "image/png",
      }),
    );

    const editor = canvasElement.querySelector(
      ".astrolabe-editor p:last-of-type",
    );
    await userEvent.click(editor);
    await userEvent.keyboard("About to paste image...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.paste(dataTransfer);
  },
};

export const PasteGif: Story = {
  args: {
    initialText: `<p>Paste a GIF copied with HTML and file clipboard data.</p><p></p>`,
    plugins: [
      HyperImage.configure({
        storage: createIndexedDBBlobStore(),
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/html", `<img src="${SurpriseGif}">`);
    // A second image, which is the gif transcoded by the browser into a PNG
    dataTransfer.items.add(
      new File([await urlToBlob(Robbie)], "browser-transcoded.png", {
        type: "image/png",
      }),
    );

    const editor = canvasElement.querySelector(
      ".astrolabe-editor p:last-of-type",
    );
    await userEvent.click(editor);
    await userEvent.keyboard("About to paste gif...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.paste(dataTransfer);

    await waitFor(() => {
      const [figure] = getHyperImageFigures(canvasElement);
      const img = figure?.querySelector<HTMLImageElement>("img");
      expect(img?.src).toMatch(/^data:image\/gif/);
    });
  },
};

export const PasteWithResize: Story = {
  args: {
    initialText: `<p>Paste an image - it will be resized to 100px width for display, but the original is preserved!</p><p></p>`,
    plugins: [
      HyperImage.configure({
        storage: debugStore,
        imageOptions: { maxWidth: 100, maxSizeBytes: 0 },
      }),
    ],
  },
  parameters: {
    storyPlacement: "after",
  },
  decorators: [withStorageDebugPanel(debugStore)],
  play: async ({ canvasElement }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File([await urlToBlob(Robbie)], "robbie.small.png", {
        type: "image/png",
      }),
    );

    const editor = canvasElement.querySelector(
      ".astrolabe-editor p:last-of-type",
    );
    await userEvent.click(editor);
    await userEvent.keyboard("Pasting resized image...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.paste(dataTransfer);
    await waitFor(async () => {
      expect(await debugStore.listAll()).toHaveLength(1);
    });
    await refreshPanel();
  },
};

export const PreviewsWithOriginals: Story = {
  args: {
    initialText: `
    <p> Missing:
      <figure data-astrolb-type="hyperimage" data-astrolb-id="ghost-1" data-astrolb-is-preview="true"><img src="${GhostPreview}"></img></figure>
    Restored:
    <figure data-astrolb-type="hyperimage" data-astrolb-id="${restoredOriginalId}" data-astrolb-is-preview="true"><img src="${RestoredPreview}"></img></figure>
    </p>`,
    plugins: [
      HyperImage.configure({
        storage: restoredOriginalStore,
        documentId: restoredOriginalScopeId,
      }),
    ],
  },
  parameters: {
    storyPlacement: "after",
  },
  decorators: [withStorageDebugPanel(restoredOriginalStore)],
  loaders: [
    async () => {
      await restoredOriginalStore.clear();
      await restoredOriginalStore.store(
        restoredOriginalId,
        await urlToBlob(Sportacus),
        { width: 1, height: 1, mimeType: "image/png" },
        restoredOriginalScopeId,
      );
      return {};
    },
  ],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const missingFigure = canvasElement.querySelector<HTMLElement>(
        `.astrolabe-editor figure[data-astrolb-id="ghost-1"]`,
      );
      const restoredFigure = canvasElement.querySelector<HTMLElement>(
        `.astrolabe-editor figure[data-astrolb-id="${restoredOriginalId}"]`,
      );
      expect(missingFigure).toBeTruthy();
      expect(restoredFigure).toBeTruthy();
      expect(missingFigure?.dataset.astrolbIsPreview).toBe("true");
      expect(restoredFigure?.dataset.astrolbIsPreview).toBe("true");
    });
  },
};

export const DeletingFigureClearsStorage: Story = {
  args: {
    initialText: `<p>Paste a resized image, then delete it.</p><p></p>`,
    plugins: [
      HyperImage.configure({
        storage: deleteFigureStore,
        imageOptions: { maxWidth: 100, maxSizeBytes: 0 },
      }),
    ],
  },
  parameters: {
    storyPlacement: "after",
  },
  decorators: [withStorageDebugPanel(deleteFigureStore)],
  loaders: [
    async () => {
      await deleteFigureStore.clear();
      return {};
    },
  ],
  play: async ({ canvasElement }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File([await urlToBlob(Robbie)], "robbie.small.png", {
        type: "image/png",
      }),
    );

    let lastParagraph = canvasElement.querySelector(
      ".astrolabe-editor p:last-of-type",
    );
    await userEvent.click(lastParagraph);
    await userEvent.paste(dataTransfer);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await refreshPanel();
    await expect(await deleteFigureStore.listAll()).toHaveLength(1);

    lastParagraph = canvasElement.querySelector(
      ".astrolabe-editor p:last-of-type",
    );
    await userEvent.click(lastParagraph);
    await userEvent.keyboard("About to delete image...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const image = canvasElement.querySelector(".astrolabe-editor img");
    await userEvent.click(image);
    await userEvent.keyboard("{Backspace}");

    await waitFor(async () => {
      await expect(await deleteFigureStore.listAll()).toHaveLength(0);
    });
    await refreshPanel();
  },
};
