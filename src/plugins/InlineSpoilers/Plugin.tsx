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
  focusable?: boolean;
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

// These regex detect the use of || as pseudo-markdown shortcut for applying inline spoilers
// i.e. ||text to be spoilered||, when typed in and pasted in respectively.
// Adapted from the regex used for the strikethough extension here:
// https://github.com/ueberdosis/tiptap/blob/781cdfa54ebd1ba4733f63bb9d5844a59703a7e8/packages/extension-strike/src/strike.ts#L31
export const inputRegex = /(?:^|\s)((?:\|\|)((?:[^\|]+))(?:\|\|))$/;
export const pasteRegex = /(?:^|\s)((?:\|\|)((?:[^\|]+))(?:\|\|))/g;

const toggleSpoilersOnKeydown = (event: KeyboardEvent) => {
  console.log("in keydown event");
  if (
    event.key !== "R" ||
    event.ctrlKey ||
    event.metaKey ||
    !event.altKey ||
    !event.shiftKey
  ) {
    console.log("no key match");
    return;
  }
  if (document.activeElement?.getAttribute("data-type") !== PLUGIN_NAME) {
    console.log("activeElement", document.activeElement);
    return;
  }
  const spoilersElement = document.activeElement;
  const currentValue = spoilersElement.getAttribute("data-visible");
  if (!currentValue) {
    console.log("element attribute has no currentValue");
    return;
  }
  const newValue = currentValue === "false" ? "true" : "false";
  console.log(`toggling data-visible from ${currentValue} to ${newValue}`);
  spoilersElement.setAttribute("data-visible", newValue);
};

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

  addOptions() {
    return {
      // Editing functions break if you add tabindex=0,
      // which we want in the view only state to allow revealing spoilers via keyboard navigation,
      // but we can't directly assess this.editor in renderHTML so it needs to be set via configuration based on the editor props.
      focusable: false,
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
        tabindex: this.options.focusable ? 0 : undefined,
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

  // I feel like there should be a better way to do this,
  // but ProseMirror's handleKeyDown doesn't seem to work in a non-editable editor
  onCreate() {
    if (this.editor.isEditable) {
      return;
    }
    document.addEventListener("keydown", toggleSpoilersOnKeydown);
  },

  onDestroy() {
    if (this.editor.isEditable) {
      return;
    }
    document.removeEventListener("keydown", toggleSpoilersOnKeydown);
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
