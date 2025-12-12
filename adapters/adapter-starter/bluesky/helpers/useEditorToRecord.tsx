import { useCurrentEditor } from "@tiptap/react";
import React from "react";
import {
  convert as toBlueskyRichtText,
  finalizeRecords,
  type ConverterMarkPlugin,
  type ConverterPlugin,
  type TreeTransformPlugin,
} from "../src/index.js";
import { type DocumentType } from "@tiptap/core";
import type { AppBskyFeedPost } from "@atproto/api";

const RECORD_BASE = {
  text: "loading...",
  facets: [],
  $type: "app.bsky.feed.post",
  createdAt: new Date().toISOString(),
} satisfies AppBskyFeedPost.Record;

export const useEditorToRecord = ({
  initialRecords,
  jsonDocPlugins,
  treePlugins,
}: {
  initialRecords?: readonly AppBskyFeedPost.Record[];
  jsonDocPlugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
  treePlugins?: readonly TreeTransformPlugin[];
}) => {
  const { editor } = useCurrentEditor();
  const [records, setRecords] = React.useState<AppBskyFeedPost.Record[]>(
    initialRecords
      ? [...initialRecords].map((record) => ({
          ...RECORD_BASE,
          text: record.text,
          facets: record.facets,
        }))
      : [{ ...RECORD_BASE }]
  );

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const convertAndSetResult = async () => {
      const editorJson = editor.getJSON();
      if (editorJson) {
        const draftResults = await toBlueskyRichtText(
          structuredClone(editorJson) as DocumentType,
          {
            jsonDocPlugins: jsonDocPlugins,
            treePlugins: treePlugins,
          }
        );

        const finalRecords = finalizeRecords(draftResults, []);
        setRecords(() =>
          finalRecords.map((record) => ({
            ...RECORD_BASE,
            text: record.text,
            facets: record.facets,
          }))
        );
      }
    };

    editor?.on("create", convertAndSetResult);
    editor?.on("update", convertAndSetResult);
    return () => {
      editor?.off("create", convertAndSetResult);
      editor?.off("update", convertAndSetResult);
    };
  }, [editor, jsonDocPlugins, treePlugins]);

  return records;
};
