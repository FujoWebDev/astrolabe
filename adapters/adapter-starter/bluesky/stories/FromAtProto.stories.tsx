import type { AppBskyFeedPost } from "@atproto/api";
import { convert as toMdast } from "@fujocoded/astdapters-mdast-starter";
import {
  type EditorTreeViewConfig,
  withEditorTreeViewer,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DocumentType } from "@tiptap/core";
import { BlueskyThread } from "astrolabe-test-utils";
import { toMarkdown } from "mdast-util-to-markdown";
import { useEditorToRecord } from "../helpers/useEditorToRecord.js";
import { convert, fromBlueskyPost } from "../src/index.js";
import record from "./records/did:plc:r2vpg2iszskbkegoldmqa322:app.bsky.feed.post:3m2svesohjs2c.json";

const editorTreeViews: EditorTreeViewConfig[] = [
  {
    id: "bluesky-rich-text",
    label: "Bluesky Rich Text",
    compute: async ({ editorJson }) => {
      if (!editorJson) {
        return {
          type: "loading",
          content: "Editor content is not available yet.",
        };
      }
      try {
        const richText = await convert(
          structuredClone(editorJson) as DocumentType
        );
        return {
          type: "json",
          content: {
            text: richText.text.text,
            facets: richText.text.facets,
          },
        };
      } catch (error) {
        console.error(
          "Failed to convert editor state to Bluesky Rich Text",
          error
        );
        return {
          type: "error",
          content: "Unable to convert editor state to Bluesky Rich Text.",
        };
      }
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
    // TODO: this will only look right once we get the Bluesky translation to correctly
    // handle mentions and links (they shouldn't be expanded because Bluesky supports
    // different text and link, just not in its UI).
    const blueskyRecord = useEditorToRecord({
      initialRecords: [record.value as AppBskyFeedPost.Record],
    });

    return <BlueskyThread records={[record.value as AppBskyFeedPost.Record]} />;
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
    initialText: fromBlueskyPost(record.value as AppBskyFeedPost.Record),
  },
};
