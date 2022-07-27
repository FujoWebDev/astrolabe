import "./editor.css";

import {
  EditorContent,
  FloatingMenu,
  JSONContent,
  useEditor,
} from "@tiptap/react";

import Document from "@tiptap/extension-document";
import { FloatingMenuOptions } from "./FloatingMenu";
import HardBreak from "@tiptap/extension-hard-break";
import { ImagePlugin } from "./plugins/Image";
import { OEmbedPlugin } from "./plugins/OEmbed";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { TweetPlugin } from "./plugins/Twitter";

export interface EditorProps {
  editable: boolean;
  initialContent: string;
  onContentChange: (newContent: JSONContent) => void;
}

export const EXTENSIONS = [
  Document,
  Paragraph,
  Text,
  // TODO: figure out how to set this up so it can be used on mobile
  HardBreak,
  ImagePlugin,
  TweetPlugin,
  OEmbedPlugin,
];

export const Editor = (props: EditorProps) => {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: props.initialContent,
    editable: props.editable,
    // TODO: this will likely need to be kept in sync with the props
    // through other means
    onUpdate: ({ editor }) => {
      if (!editor) {
        return;
      }
      props.onContentChange(editor.getJSON());
    },
    onCreate({ editor }) {
      if (!editor) {
        return;
      }
      props.onContentChange(editor.getJSON());
    },
  });
  return (
    <>
      <EditorContent editor={editor} />
      {editor && (
        <FloatingMenu editor={editor}>
          <FloatingMenuOptions editor={editor} />
        </FloatingMenu>
      )}
    </>
  );
};
