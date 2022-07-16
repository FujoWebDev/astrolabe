import {
  EditableTweetComponent,
  TweetComponent,
  TweetLoadingPlaceholder,
} from "./Components";
import { goToTrailingPragraph, loadToDom, withViewWrapper } from "../utils";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface TweetOptions {
  src: string;
  width?: number;
  height?: number;
  spoilers?: boolean;
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
        parseHTML: (element) =>
          element
            .querySelector(`div[data-type=${PLUGIN_NAME}]`)
            ?.getAttribute("data-src"),
      },
      spoilers: {
        default: false,
      },
    };
  },

  renderHTML({ node }) {
    return loadToDom(TweetLoadingPlaceholder, node.attrs as TweetOptions);
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      this.editor.isEditable
        ? EditableTweetComponent
        : withViewWrapper(PLUGIN_NAME, TweetComponent)
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
