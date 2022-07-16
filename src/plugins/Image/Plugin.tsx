import { EditableImageComponent, ImageComponent } from "./Components";
import { goToTrailingPragraph, loadToDom, withViewWrapper } from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export const ImagePluginKey = new PluginKey("ImagePlugin");

export interface ImageOptions {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  spoilers?: boolean;
}

export const PLUGIN_NAME = "image";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      setImage: (options: ImageOptions) => ReturnType;
    };
  }
}

export const ImagePlugin = Node.create<ImageOptions>({
  name: PLUGIN_NAME,
  group: "block",

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("src"),
      },
      spoilers: {
        default: false,
      },
      alt: {
        default: "no alt",
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(ImageComponent, node.attrs as ImageOptions);
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableImageComponent
        : withViewWrapper(PLUGIN_NAME, ImageComponent)
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
            .command(goToTrailingPragraph)
            .run();
        },
    };
  },

  // TODO: if we're in edit mode and the image is the last element of the editor, make
  // sure that a paragraph stays at the end of it
  // onTransaction() {}
});
