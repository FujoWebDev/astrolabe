import "./editor.css";

import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  JSONContent,
  useEditor,
} from "@tiptap/react";
// import { BubbleMenuOptions, MenuOption } from "./BubbleMenu";
import { Mark, Node, isTextSelection } from "@tiptap/core";

import { BlockWithMenuPlugin } from "@bobaboard/tiptap-block-with-menu";
import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
// import { FloatingMenuOptions } from "./FloatingMenu";
import HardBreak from "@tiptap/extension-hard-break";
import { ImagePlugin } from "@bobaboard/tiptap-image";
import { InlineSpoilersPlugin } from "@bobaboard/tiptap-inline-spoilers";
import Link from "@tiptap/extension-link";
// import Italic from "@tiptap/extension-italic";
import { OEmbedPlugin } from "@bobaboard/tiptap-oembed";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { toggleSpoilersOnKeydown } from "../plugins/utils";

export interface EditorProps {
  editable: boolean;
  initialContent: string;
  onContentChange: (newContent: JSONContent) => void;
  addedExtensions?: (Node<any, any> | Mark<any, any>)[];
  extensionConfigs?: {
    extensionName: string;
    config: Record<string, any>;
  }[];
  customBubbleMenuButtons?: any[];
  customFloatingMenuButtons?: any[];
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
  InlineSpoilersPlugin,
];

export const Editor = (props: EditorProps) => {
  const defaultExtensions = props.editable
    ? DEFAULT_EXTENSIONS
    : DEFAULT_EXTENSIONS.map((extension) => {
        return extension.name === InlineSpoilersPlugin.name
          ? InlineSpoilersPlugin.configure({ focusable: true })
          : extension;
      });
  const currentExtensions = props.addedExtensions
    ? [...defaultExtensions, ...props.addedExtensions]
    : defaultExtensions;
  const configuredExtensions =
    props.extensionConfigs && props.extensionConfigs.length > 0
      ? currentExtensions.map((extension) => {
          const config = props.extensionConfigs?.find(
            (config) => config.extensionName === extension.name
          );
          return config ? extension.configure(config.config) : extension;
        })
      : currentExtensions;
  const editor = useEditor({
    extensions: configuredExtensions,
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
      if (editor.isEditable) {
        return;
      }
      // We need to add the event listener that handles the keyboard shortcut for revealing/rehiding spoilers here
      // because if we do it in onCreate in the plugins themselves, it will add multiples of the same listener
      // if the editor has more than one plugin with spoilers installed.
      // Currently this uses the same shortcut as setting inline spoilers in an editable editor, Alt+Shift+R,
      // but since it requires the spoilered element to be focused we could consider having it triggered simply on "enter"
      if (
        editor.extensionManager.extensions.some(
          (extension) =>
            extension.name === InlineSpoilersPlugin.name ||
            extension.name === BlockWithMenuPlugin.name ||
            extension.parent?.name === BlockWithMenuPlugin.name
        )
      ) {
        document.addEventListener("keydown", toggleSpoilersOnKeydown);
      }
    },
    onDestroy() {
      document.removeEventListener("keydown", toggleSpoilersOnKeydown);
    },
  });

  console.log(editor);
  return (
    <>
      <EditorContent editor={editor} />
      {editor && (
        <FloatingMenu editor={editor}>
          {/* <FloatingMenuOptions
            editor={editor}
            extensions={configuredExtensions}
            customButtons={props.customFloatingMenuButtons}
          /> */}
          Whatever
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
          What the fuck
          {/* <BubbleMenuOptions
            editor={editor}
            extensions={configuredExtensions}
            customButtons={props.customBubbleMenuButtons}
          /> */}
        </BubbleMenu>
      )}
    </>
  );
};
