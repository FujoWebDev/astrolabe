import React from "react";

import { toMarkdown } from "mdast-util-to-markdown";
import { toMdast } from "../src/index.js";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { withEditorTreeViewer } from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

import type { EditorTreeViewConfig } from "@fujocoded/astrolabe-editor-tree-viewer/types";

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "mdast-json",
    label: "mdast JSON",
    compute: async ({ editorJson }) => {
      const mdastTree = editorJson ? toMdast(editorJson) : u("root", []);

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
      if (!editorJson) {
        return {
          type: "markdown",
          content: "",
        };
      }
      const mdastTree = editorJson ? toMdast(editorJson) : {};

      return {
        type: "markdown",
        content: toMarkdown(mdastTree, { emphasis: "_" }),
      };
    },
  },
];

const Meta = {
  title: "Adapters/Starter—Markdown (mdast)",
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

export const HeadingsAndLists: Story = {
  args: {
    initialText: `<h1>My 5 Blorbos!</h1>
<h2>This list <strong>is</strong> subject to change</h2>
<p>Top 3 (can't decide order):</p>
<ul>
  <li>The littlest meow meow</li>
  <li>Incredibly problematic villain</li>
  <li>Puts the "old man" in <em>old man yaoi</em></li>
</ul>
<p>Others:</p>
<ol start="4">
  <li>Character who deserved better</li>
  <li>Character who <u>definitely</u> deserved better</li>
</ol>`,
  },
};

export const BlockquotesAndBreaks: Story = {
  args: {
    initialText: `
<p>A favorite quote:</p>      
<blockquote>
  <p>I see now that the circumstances of one’s birth are irrelevant.</p>
  <p>It is what you do with the gift of life<br/>that determines who you are.</p>
</blockquote>
<p>— Mewtwo<br/>Pokemon, The First Movie</p>
<hr/>
<p>Follow for more inspiring anime quotes 💖🌟</p>`,
  },
};
