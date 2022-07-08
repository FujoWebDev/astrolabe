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
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

interface EditorProps {
  editable: boolean;
  initialContent: string;
  onContentChange: (newContent: { json: JSONContent; html: string }) => void;
}
export const Editor = (props: EditorProps) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      // TODO: figure out how to set this up so it can be used on mobile
      HardBreak,
      ImagePlugin,
    ],
    // TODO: this will likely need to be kept in sync with the props
    // through other means
    onUpdate: ({ editor }) => {
      if (!editor) {
        return;
      }
      props.onContentChange({
        json: editor.getJSON(),
        html: editor.getHTML(),
      });
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
