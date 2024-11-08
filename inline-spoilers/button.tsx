import { useCurrentEditor, type Editor } from "@tiptap/react";

export const InlineSpoilersButton = ({ editor }: { editor: Editor | null }) => {
  const { editor: currentEditor } = useCurrentEditor();
  const menuEditor = editor ?? currentEditor!;
  return (
    <button
      title="text spoilers"
      aria-label="text spoilers"
      aria-pressed={menuEditor.isActive("inlineSpoilers")}
      onClick={() => menuEditor.chain().focus().toggleInlineSpoilers().run()}
    >
      {menuEditor.isActive("inlineSpoilers") ? "unspoiler" : "spoiler"}
    </button>
  );
};
