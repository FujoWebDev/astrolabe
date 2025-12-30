import { expect, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { type EditorProviderProps } from "@tiptap/react";
import { Plugin as HyperImage } from "../src/Node.js";
import "../src/hyperimage.css";
import {
  withEditorTreeViewer,
  type EditorTreeViewConfig,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

import Robbie from "./assets/robbie.small.png";
import Sportacus from "./assets/sportacus.small.png";

const urlToBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return response.blob();
};

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
    plugins: [HyperImage],
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
      })
    );

    const editor = canvasElement.querySelector(
      ".astrolabe-editor p:last-of-type"
    );
    await userEvent.click(editor);
    await userEvent.keyboard("About to paste image...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.paste(dataTransfer);
  },
};
