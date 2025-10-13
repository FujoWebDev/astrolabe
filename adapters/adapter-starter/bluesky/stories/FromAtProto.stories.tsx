import { convert, fromBlueskyPost } from "../src/index.js";
import { convert as toMdast } from "@fujocoded/astdapters-mdast-starter";
import record from "./records/did:plc:r2vpg2iszskbkegoldmqa322:app.bsky.feed.post:3m2svesohjs2c.json";
import { toMarkdown } from "mdast-util-to-markdown";

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  withEditorTreeViewer,
  type EditorTreeViewConfig,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";
import { BlueskyPost } from "./components/BlueskyPost.js";
import { useCurrentEditor } from "@tiptap/react";
import React from "react";

const convertFromRecord = (record: Record<string, unknown>) => {
  console.dir(record);
  const post = fromBlueskyPost(record.value as any);
  console.dir(post);
  return post;
};

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "bluesky-rich-text",
    label: "Bluesky Rich Text",
    compute: async ({ editorJson }) => {
      return {
        type: "json",
        content: {
          text: record.value.text,
          facets: record.value.facets,
        },
      };
    },
  },
  {
    id: "mdast-json",
    label: "ProseMirror JSON",
    compute: async ({ editorJson }) => {
      const mdastTree = editorJson;
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

const meta = {
  title: "Adapters/Starter—Bluesky-From",
  parameters: {
    layout: "padded",
    plugins: [],
    hideEditor: false,
    editorTreeViewer: {
      editorTreeViews,
    },
  },
  decorators: [withEditorTreeViewer],
  render: ({ record }) => {
    const { editor } = useCurrentEditor();
    const [editedRecord, setEditedRecord] =
      React.useState<Record<string, unknown>>(record);
    React.useEffect(() => {
      if (editor) {
        editor.on("update", async () => {
          const json = editor.getJSON();
          if (json) {
            const newRecord = structuredClone(record);
            const convertedRecord = await convert(json);
            newRecord.value.text = convertedRecord.text.text;
            newRecord.value.facets = convertedRecord.text.facets;
            console.dir(newRecord);
            setEditedRecord(newRecord);
          }
        });
      }
      return () => {
        editor?.off("update");
      };
    }, [editor, record]);
    return <>{editor && <BlueskyPost record={editedRecord} />}</>;
  },
} satisfies Meta<{
  initialText: string | Record<string, unknown>;
  record: Record<string, unknown>;
}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BaseLexicon: Story = {
  args: {
    record: record,
    initialText: convertFromRecord(record),
  },
};
