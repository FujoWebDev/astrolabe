import "./editor.css";

import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  JSONContent,
  useEditor,
} from "@tiptap/react";
import { BubbleMenuOptions, MenuOption } from "./BubbleMenu";
import { Mark, Node, isTextSelection } from "@tiptap/core";

import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import { FloatingMenuOptions } from "./FloatingMenu";
import HardBreak from "@tiptap/extension-hard-break";
import { ImagePlugin } from "@bobaboard/tiptap-image";
import Link from "@tiptap/extension-link";
// import Italic from "@tiptap/extension-italic";
import { OEmbedPlugin } from "@bobaboard/tiptap-oembed";
import Paragraph from "@tiptap/extension-paragraph";
import React from "react";
import Text from "@tiptap/extension-text";

// TODO: Allow passing extension configs as props, passing them as part of the addedExtentions array breaks things (at least in storybook)
export interface EditorProps {
  editable: boolean;
  initialContent: string;
  onContentChange: (newContent: JSONContent) => void;
  addedExtensions?: (Node<any, any> | Mark<any, any>)[];
  customBubbleMenuButtons?: MenuOption[];
  customFloatingMenuButtons?: MenuOption[];
}

export const DEFAULT_EXTENSIONS: (Node<any, any> | Mark<any, any>)[] = [
  Document,
  Paragraph,
  Text,
  // TODO: figure out how to set this up so it can be used on mobile
  HardBreak,
  Bold,
  Link.configure({
    openOnClick: false,
  }),
  ImagePlugin,
  OEmbedPlugin,
];

export const Editor = (props: EditorProps) => {
  const currentExtensions = props.addedExtensions
    ? [...DEFAULT_EXTENSIONS, ...props.addedExtensions]
    : DEFAULT_EXTENSIONS;
  const editor = useEditor({
    extensions: currentExtensions,
    content: props.initialContent,
    editable: props.editable,
    // TODO: this will likely need to be kept in sync with the props
    // through other means
    onUpdate: ({ editor }) => {
      console.log("update! update! update!");
      console.log(props.onContentChange);
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
          <FloatingMenuOptions
            editor={editor}
            extensions={currentExtensions}
            customButtons={props.customFloatingMenuButtons}
          />
        </FloatingMenu>
      )}
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor, state, view, to, from }) => {
            // We need to add logic to disable the bubble menu from appearing
            // when nodes that do not contain formattable text (e.g. images) are selected.
            // But we also need to reimplement the default behavior because setting shouldShow totally overrides it.
            // This code is adapted from https://github.com/ueberdosis/tiptap/blob/84ac1dc9c747f66aa64a64bf45a4ef85863b3a58/packages/extension-bubble-menu/src/bubble-menu-plugin.ts#L46
            const { doc, selection } = state;
            const { empty } = selection;

            // Sometime check for `empty` is not enough.
            // Doubleclick an empty paragraph returns a node size of 2.
            // So we check also for an empty text size.
            const isEmptyTextBlock =
              !doc.textBetween(from, to).length && isTextSelection(selection);

            const hasEditorFocus = view.hasFocus();

            // Only show the bubble menu for elements with formattable text
            const isText = isTextSelection(selection);

            if (
              !hasEditorFocus ||
              empty ||
              isEmptyTextBlock ||
              !editor.isEditable ||
              !isText
            ) {
              return false;
            }
            return true;
          }}
        >
          <BubbleMenuOptions
            editor={editor}
            extensions={currentExtensions}
            customButtons={props.customBubbleMenuButtons}
          />
        </BubbleMenu>
      )}
    </>
  );
};
