import { useCurrentEditor } from "@tiptap/react";
import React from "react";
import {
  convert as toBlueskyRichtText,
  type ConverterMarkPlugin,
  type ConverterPlugin,
} from "../src/index.js";
import { type DocumentType } from "@tiptap/core";
import type { AppBskyFeedPost } from "@atproto/api";

export const useEditorToRecord = ({
  initialRecord,
  jsonDocPlugins,
}: {
  initialRecord?: AppBskyFeedPost.Record;
  jsonDocPlugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
}) => {
  const { editor } = useCurrentEditor();
  const [record, setRecord] = React.useState<AppBskyFeedPost.Record>(
    initialRecord ?? {
      text: "loading...",
      facets: [],
      $type: "app.bsky.feed.post",
      createdAt: new Date().toISOString(),
    }
  );

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const convertAndSetResult = async () => {
      const editorJson = editor.getJSON();
      if (editorJson) {
        const blueskyRecord = await toBlueskyRichtText(
          structuredClone(editorJson) as DocumentType,
          {
            jsonDocPlugins: jsonDocPlugins,
          }
        );

        setRecord((prev) => ({
          ...prev,
          text: blueskyRecord.text.text,
          facets: blueskyRecord.text.facets,
        }));
      }
    };
    editor?.on("create", convertAndSetResult);
    editor?.on("update", convertAndSetResult);
    return () => {
      editor?.off("create", convertAndSetResult);
      editor?.off("update", convertAndSetResult);
    };
  }, [editor, jsonDocPlugins]);

  return record;
};
