import { BlockWithMenuOptions, BlockWithMenuPlugin } from "../BlockWithMenu";
import { EditableImageComponent, ImageComponent } from "./Components";
import {
  goToTrailingParagraph,
  loadToDom,
  withViewWrapper,
  withViewWrapperOld,
} from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export const ImagePluginKey = new PluginKey("ImagePlugin");

export interface ImageOptions extends BlockWithMenuOptions {
  src: string;
  alt?: string;
}

export const PLUGIN_NAME = "image";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      setImage: (options: ImageOptions) => ReturnType;
    };
  }
}

export const ImagePlugin = BlockWithMenuPlugin.extend<ImageOptions>({
  name: PLUGIN_NAME,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("src"),
      },
      alt: {
        default: "no alt",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("alt"),
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(ImageComponent, {
      pluginName: PLUGIN_NAME,
      attributes: node.attrs,
    });
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableImageComponent
        : withViewWrapper(PLUGIN_NAME, ImageComponent, {
            pluginName: PLUGIN_NAME,
            editable: false,
          })
    );
  },

  parseHTML() {
    return [
      {
        tag: `picture[data-type=${this.name}]`,
      },
    ];
  },

  addCommands() {
    return {
      setImage:
        (props: ImageOptions) =>
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
