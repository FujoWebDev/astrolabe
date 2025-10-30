import type { Meta, StoryObj } from "@storybook/react-vite";
import { type EditorProviderProps } from "@tiptap/react";
import { Plugin as ThreadBreakPlugin } from "../src/Node.js";
import "../src/thread-break.css";
import withEditorTreeViewer from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

const meta = {
  title: "Astrolabe/ThreadBreak",
  parameters: {
    layout: "padded",
    buttons: [],
    storyPlacement: "after",
    editorTreeViewer: {
      editorTreeViews: [],
    },
  },
  args: {
    // @ts-expect-error - need to add this to the global args
    plugins: [ThreadBreakPlugin],
  },
  decorators: [withEditorTreeViewer],
  component: () => null,
} satisfies Meta<EditorProviderProps & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
  args: {
    initialText:
      "Text before thread break<div data-astrolb-type='thread-break' data-astrolb-skip-on='mastodon;tumblr;' data-astrolb-break-on='bsky;twitter;'></div><p>Text after thread break</p>",
  },
};

export const ViewOnly: Story = {
  args: {
    initialText:
      "Text before thread break<div data-astrolb-type='thread-break' data-astrolb-skip-on='mastodon;tumblr;' data-astrolb-break-on='bsky;twitter;'></div><p>Text after thread break</p>",
    editable: false,
  },
};

export const DefaultValues: Story = {
  args: {
    initialText:
      "Text before thread break<div data-astrolb-type='thread-break'></div><p>Text after thread break</p>",
  },
};

export const NonDefaultValues: Story = {
  args: {
    initialText:
      "Text before thread break<div data-astrolb-type='thread-break' data-astrolb-skip-on='twitter;' data-astrolb-break-on='mastodon;tumblr;bsky;'></div><p>Text after thread break</p>",
  },
};
