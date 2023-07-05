import {
  BlockWithMenuComponent,
  EditableBlockWithMenuComponent,
} from "./Components";
import { goToTrailingParagraph, loadToDom, withViewWrapper } from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export const BlockWithMenuPluginKey = new PluginKey("BLockWithMenuPlugin");

export interface BlockWithMenuOptions {
  width?: number;
  height?: number;
  spoilers?: boolean;
}

export const PLUGIN_NAME = "blockWithMenu";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      setBlock: (options: BlockWithMenuOptions) => ReturnType;
    };
  }
}

export const BlockWithMenuPlugin = Node.create<BlockWithMenuOptions>({
  name: PLUGIN_NAME,
  group: "block",

  addAttributes() {
    return {
      spoilers: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-spoilers"),
      },
      height: {
        default: 300,
        parseHTML: (element) => element.getAttribute("data-height"),
      },
      width: {
        default: 300,
        parseHTML: (element) => element.getAttribute("data-height"),
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(
      BlockWithMenuComponent,
      node.attrs as BlockWithMenuOptions
    );
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableBlockWithMenuComponent
        : withViewWrapper(PLUGIN_NAME, BlockWithMenuComponent)
    );
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type=${this.name}]`,
      },
    ];
  },

  addCommands() {
    return {
      setBlock:
        (props: BlockWithMenuOptions) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              preserveWhitespace: true,
              attrs: {
                ...props,
              },
            })
            .command(goToTrailingParagraph)
            .run();
        },
    };
  },
});
