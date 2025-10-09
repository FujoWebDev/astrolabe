import React from "react";

import { toMarkdown } from "mdast-util-to-markdown";
import { convert as toMdast } from "../src/index.js";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { withEditorTreeViewer } from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

import type { EditorTreeViewConfig } from "@fujocoded/astrolabe-editor-tree-viewer/types";

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "mdast-json",
    label: "mdast JSON",
    compute: async ({ editorJson }) => {
      const mdastTree = toMdast(editorJson);

      return {
        type: "json",
        content: mdastTree as unknown as Record<string, unknown>,
      };
    },
  },
  {
    id: "markdown",
    label: "Markdown",
    compute: async ({ editorJson }) => {
      const mdastTree = toMdast(editorJson);

      return {
        type: "markdown",
        content: toMarkdown(mdastTree, { emphasis: "_" }),
      };
    },
  },
];

const Meta = {
  title: "Adapters/Starter—Markdown (mdast)",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    editorTreeViewer: {
      editorTreeViews,
    },
  },
  decorators: [withEditorTreeViewer],
  component: () => null,
} satisfies Meta<{ initialText: string }>;

export default Meta;
type Story = StoryObj<typeof Meta>;

export const BoldAndEmphasis: Story = {
  args: {
    initialText:
      "This is a <strong>strong</strong> statement, don't <em>you</em> think?",
  },
};

export const MarkNesting: Story = {
  args: {
    initialText:
      "This is a <strong>strong and <em>italic</em></strong> statement, don't <em>you</em> think?",
  },
};

export const LinkAndUnderline: Story = {
  args: {
    initialText:
      "This is a <a href='https://fujocoded.com'>link</a> and this is a <u>underlined</u> statement.",
  },
};

export const Code: Story = {
  args: {
    initialText: "This is a <code>code</code> statement.",
  },
};

export const CodeBlock: Story = {
  args: {
    initialText: "This is a <pre>code block</pre> statement.",
  },
};
