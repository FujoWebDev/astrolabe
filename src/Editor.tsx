import { EditorContent, useEditor } from "@tiptap/react";

import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

interface EditorProps {
  editable: boolean;
  initialContent: string;
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
  });
  return <EditorContent editor={editor} />;
};
