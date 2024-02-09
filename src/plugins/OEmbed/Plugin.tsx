import {
  BlockWithMenuOptions,
  BlockWithMenuPlugin,
} from "@bobaboard/tiptap-block-with-menu";
import { OEmbedLoader, OEmbedPlaceholder } from "./Components";
import { goToTrailingParagraph, loadToDom } from "../utils";

import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface OEmbedData extends BlockWithMenuOptions {
  src: string;
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

export const OEmbedPlugin = BlockWithMenuPlugin.extend<{
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
      ...this.parent?.(),
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src"),
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(OEmbedPlaceholder, {
      pluginName: PLUGIN_NAME,
      attributes: node.attrs,
    });
  },

  // We don't need withViewWrapper here because both editable and view-only editors use OEmbedLoader
  // which already includes the NodeViewWrapper
  addNodeView() {
    return ReactNodeViewRenderer(OEmbedLoader);
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
});
