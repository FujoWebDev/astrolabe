import {
  EditableInlineSpoilersComponent,
  InlineSpoilerComponent,
} from "./Components";
import { Node, mergeAttributes } from "@tiptap/core";

import { ReactNodeViewRenderer } from "@tiptap/react";
import { withViewWrapper } from "../utils";

export interface InlineSpoilersOptions {
  visible?: boolean;
}

export const PLUGIN_NAME = "inlineSpoilers";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      setInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
      toggleInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
      unsetInlineSpoilers: () => ReturnType;
    };
  }
}

export const InlineSpoilersPlugin = Node.create<InlineSpoilersOptions>({
  name: PLUGIN_NAME,
  group: "inline",
  inline: true,
  content: "inline*",

  addAttributes() {
    return {
      visible: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-visible"),
        renderHTML: (attributes) => {
          return {
            "data-visible": attributes.visible,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type=${this.name}]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableInlineSpoilersComponent
        : InlineSpoilerComponent
    );
  },

  addCommands() {
    return {
      setInlineSpoilers:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleInlineSpoilers:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "text", attributes);
        },
      unsetInlineSpoilers:
        () =>
        ({ commands }) => {
          return commands.setNode("text");
        },
    };
  },
});
