import { useCurrentEditor, type Editor } from "@tiptap/react";

export const Button = ({ editor }: { editor?: Editor | null }) => {
  const { editor: currentEditor } = useCurrentEditor();
  const menuEditor = editor ?? currentEditor!;
  return (
    <button
      title="text spoilers"
      aria-label="text spoilers"
      aria-pressed={menuEditor.isActive("inline-spoilers")}
      onClick={() => menuEditor.chain().focus().toggleInlineSpoilers().run()}
    >
      {menuEditor.isActive("inline-spoilers") ? "unspoiler" : "spoiler"}
    </button>
  );
};
