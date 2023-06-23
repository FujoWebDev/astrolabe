import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

import { PluginKey } from "@tiptap/pm/state";
import { toggleAttributeOnClick } from "../utils";

export interface InlineSpoilersOptions {
  visible?: boolean;
}

export const InlineSpoilersPluginKey = new PluginKey("InlineSpoilersPlugin");

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

export const inputRegex = /(?:^|\s)((?:\|\|)((?:[^\|]+))(?:\|\|))$/;
export const pasteRegex = /(?:^|\s)((?:\|\|)((?:[^\|]+))(?:\|\|))/g;

export const InlineSpoilersPlugin = Mark.create<InlineSpoilersOptions>({
  name: PLUGIN_NAME,
  priority: 1001,

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
        "aria-label": "text spoilers",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setInlineSpoilers:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleInlineSpoilers:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetInlineSpoilers:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Alt-Shift-r": () => this.editor.commands.toggleInlineSpoilers(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ];
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
