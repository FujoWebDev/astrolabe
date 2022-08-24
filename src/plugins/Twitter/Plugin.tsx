import { EditableTweetComponent, TweetPlaceholder } from "./Components";
import { goToTrailingPragraph, loadToDom, withViewWrapper } from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface TweetOptions {
  src: string;
  width?: number;
  height?: number;
  spoilers?: boolean;
  native?: boolean;
}

export const TweetPluginKey = new PluginKey("TweetPlugin");

export const PLUGIN_NAME = "tweet";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      addTweet: (options: TweetOptions) => ReturnType;
    };
  }
}

export const TweetPlugin = Node.create<TweetOptions>({
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
      native: {
        default: true,
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(TweetPlaceholder, node.attrs as TweetOptions);
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableTweetComponent
        : // TODO: swap this with uneditable component
          withViewWrapper(PLUGIN_NAME, EditableTweetComponent)
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
      addTweet:
        (props: TweetOptions) =>
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
