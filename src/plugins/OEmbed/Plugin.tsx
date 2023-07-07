import { OEmbedLoader, OEmbedPlaceholder } from "./Components";
import { goToTrailingParagraph, loadToDom, withViewWrapperOld } from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface OEmbedData {
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
      addOEmbed: (options: OEmbedData) => ReturnType;
    };
  }
}

export const OEmbedPlugin = Node.create<{
  getRequestEndpoint: (url: string) => string;
}>({
  name: PLUGIN_NAME,
  group: "block",

  addOptions() {
    return {
      getRequestEndpoint: (url: string) =>
        `https://boba-embeds.fly.dev/iframely?url=${url}`,
    };
  },

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src"),
      },
      spoilers: {
        default: false,
      },
      width: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-width"),
      },
      height: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-height"),
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(OEmbedPlaceholder, node.attrs as OEmbedData);
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? OEmbedLoader
        : withViewWrapperOld(PLUGIN_NAME, OEmbedLoader)
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
        (props: OEmbedData) =>
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

  // TODO: if we're in edit mode and the image is the last element of the editor, make
  // sure that a paragraph stays at the end of it
  // onTransaction() {}
});
