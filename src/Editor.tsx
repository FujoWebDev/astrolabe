import { EditorContent, JSONContent, useEditor } from "@tiptap/react";

import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

interface EditorProps {
  editable: boolean;
  initialContent: string;
  onTextChange: (newText: JSONContent) => void;
}
export const Editor = (props: EditorProps) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      // TODO: figure out how to set this up so it can be used on mobile
      HardBreak,
    ],
    // TODO: this will likely need to be kept in sync with the props
    // through other means
    onUpdate: ({ editor }) => {
      if (!editor) {
        return;
      }
      props.onTextChange(editor.getJSON());
    },
  });
  return <EditorContent editor={editor} />;
};
