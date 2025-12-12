import { convert as toBlueskyRichtText } from "@fujocoded/astdapters-bluesky-starter";
import { useEditorToRecord } from "@fujocoded/astdapters-bluesky-starter/helpers";
import { convert as toMdast } from "@fujocoded/astdapters-mdast-starter";
import { useEditorToMdast } from "@fujocoded/astdapters-mdast-starter/helpers";
import {
  type EditorTreeViewConfig,
  withEditorTreeViewer,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DocumentType } from "@tiptap/core";
import type { EditorProviderProps } from "@tiptap/react";
import { BlueskyThread } from "astrolabe-test-utils";
import { toMarkdown } from "mdast-util-to-markdown";
import { toMdastNode, threadBreakSplitter } from "../adapter/thread-break.ts";
import { Plugin as ThreadBreakPlugin } from "../src/Node.js";

import "../src/thread-break.css";

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "editor-json",
    label: "Editor JSON",
    compute: async ({ editorJson }) => {
      return {
        type: "json",
        content: editorJson as unknown as Record<string, unknown>,
      };
    },
  },
  {
    id: "mdast-json",
    label: "mdast JSON",
    compute: async ({ editorJson }) => {
      const mdastTree = editorJson
        ? await toMdast(editorJson, { plugins: [toMdastNode] })
        : {};
      return {
        type: "json",
        content: mdastTree as unknown as Record<string, unknown>,
      };
    },
  },
  {
    id: "bluesky-rich-text",
    label: "Bluesky Rich Text",
    compute: async ({ editorJson }) => {
      const draftResults = await toBlueskyRichtText(
        structuredClone(editorJson) as DocumentType,
        {
          treePlugins: [threadBreakSplitter],
        }
      );

      return {
        type: "json",
        content: {
          records: draftResults.map((draft) => ({
            text: draft.record.text.text,
            length: draft.record.text.text.length,
            facets: draft.record.text.facets,
            pendingEmbeds: draft.pendingEmbeds,
          })),
        },
      };
    },
  },
];

const meta = {
  title: "Adapters/ThreadBreak",
  parameters: {
    layout: "padded",
    buttons: [],
    hideEditor: false,
    storyPlacement: "after",
    editorTreeViewer: {
      editorTreeViews,
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

export const Bluesky: Story = {
  args: {
    initialText:
      "Text before thread break<div data-astrolb-type='thread-break' data-astrolb-skip-on='mastodon;tumblr;' data-astrolb-break-on='bsky;twitter;'></div><p>Text after thread break</p>",
  },
  render: () => {
    const blueskyRecord = useEditorToRecord({
      treePlugins: [threadBreakSplitter],
    });

    return <BlueskyThread records={blueskyRecord} />;
  },
};

export const Markdown: Story = {
  args: {
    initialText:
      "Text before thread break<div data-astrolb-type='thread-break' data-astrolb-skip-on='mastodon;tumblr;' data-astrolb-break-on='bsky;twitter;'></div><p>Text after thread break</p>",
  },
  render: () => {
    const mdast = useEditorToMdast([toMdastNode]);

    return (
      <pre>
        {toMarkdown(mdast, {
          emphasis: "_",
        })}
      </pre>
    );
  },
};

export const MarkdownMultiple: Story = {
  args: {
    initialText:
      "<p>First section</p><div data-astrolb-type='thread-break'></div><p>Second section</p><div data-astrolb-type='thread-break'></div><p>Third section</p>",
  },
  render: () => {
    const mdast = useEditorToMdast([toMdastNode]);

    return (
      <pre>
        {toMarkdown(mdast, {
          emphasis: "_",
        })}
      </pre>
    );
  },
};
