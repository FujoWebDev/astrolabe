import { OEmbedLoader, OEmbedPlaceholder } from "./Components";
import { goToTrailingPragraph, loadToDom, withViewWrapper } from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface OEmbedOptions {
  src: string;
  width?: number;
  height?: number;
  spoilers?: boolean;
}

export const OEmbedPluginKey = new PluginKey("OEmbedPluginKey");

export const PLUGIN_NAME = "oembed";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      addOEmbed: (options: OEmbedOptions) => ReturnType;
    };
  }
}

export const OEmbedPlugin = Node.create<OEmbedOptions>({
  name: PLUGIN_NAME,
  group: "block",

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src"),
      },
      spoilers: {
        default: false,
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(OEmbedPlaceholder, node.attrs as OEmbedOptions);
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? OEmbedLoader
        : withViewWrapper(PLUGIN_NAME, OEmbedLoader)
    );
  },

  parseHTML() {
    return [
      {
        tag: `article[data-type=${this.name}]`,
      },
    ];
  },

  addCommands() {
    return {
      addOEmbed:
        (props: OEmbedOptions) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              preserveWhitespace: true,
              attrs: {
                ...props,
              },
            })
            .command(goToTrailingPragraph)
            .run();
        },
    };
  },

  // TODO: if we're in edit mode and the image is the last element of the editor, make
  // sure that a paragraph stays at the end of it
  // onTransaction() {}
});
