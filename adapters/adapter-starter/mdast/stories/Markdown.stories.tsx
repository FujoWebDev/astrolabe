import React from "react";

import { toMarkdown } from "mdast-util-to-markdown";
import { convert as toMdast } from "../src/index.js";

import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSONContent } from "@tiptap/core";
// import type {
//   EditorTreeViewConfig,
//   SerializableValue,
// } from "@fujocoded/astrolabe-editor-tree-viewer/types";

type SerializableValue = unknown;
type EditorTreeViewConfig = unknown;

const ensureJsonContent = (value: SerializableValue): JSONContent => {
  return value as unknown as JSONContent;
};

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "mdast-json",
    label: "mdast JSON",
    compute: ({ editorJson }) => {
      const jsonContent = ensureJsonContent(editorJson);
      const mdastTree = toMdast(jsonContent);

      return {
        type: "json",
        content: mdastTree as unknown as SerializableValue,
      };
    },
  },
  {
    id: "markdown",
    label: "Markdown",
    compute: ({ editorJson }) => {
      const jsonContent = ensureJsonContent(editorJson);
      const mdastTree = toMdast(jsonContent);

      return {
        type: "markdown",
        content: toMarkdown(mdastTree, { emphasis: "_" }),
      };
    },
  },
];

const meta = {
  title: "Adapters/Starter—Markdown (mdast)",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    plugins: [],
    hideEditor: false,
    editorTreeViews,
  },
  render: (...params) => {
    console.log(params);
    return <div>{params[0].initialText}</div>;
  },
} satisfies Meta<{ initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

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
