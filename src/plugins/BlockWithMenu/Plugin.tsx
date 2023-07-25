import {
  BlockBaseComponent,
  EditableBlockWithMenuComponent,
} from "./Components";
import {
  goToTrailingParagraph,
  loadToDom,
  toggleAttributeOnClick,
  withViewWrapper,
} from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

// This plugin is a base from which to extend other plugins with a shared set of features.
// It is not intended to be used directly in the editor in an application.

export const BlockWithMenuPluginKey = new PluginKey("BlockWithMenuPlugin");

export interface BlockWithMenuOptions {
  width?: number;
  height?: number;
  spoilers?: boolean;
  visible?: boolean;
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
      visible: {
        default: false,
      },
      height: {
        default: undefined,
        parseHTML: (element) => {
          const rawHeight = element.getAttribute("data-height");
          return rawHeight ? parseFloat(rawHeight) : null;
        },
      },
      width: {
        default: undefined,
        parseHTML: (element) => {
          const rawWidth = element.getAttribute("data-width");
          return rawWidth ? parseFloat(rawWidth) : null;
        },
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(BlockBaseComponent, {
      pluginName: PLUGIN_NAME,
      attributes: node.attrs,
    });
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableBlockWithMenuComponent
        : withViewWrapper(PLUGIN_NAME, BlockBaseComponent, {
            pluginName: PLUGIN_NAME,
            editable: false,
          })
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

  addProseMirrorPlugins() {
    return [
      toggleAttributeOnClick({
        name: this.name,
        attribute: "data-visible",
      }),
    ];
  },
});
