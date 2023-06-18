import { Mark } from "@tiptap/core";

export const PLUGIN_NAME = "inlineSpoilers";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      setInlineSpoilers: () => ReturnType;
      unsetInlineSpoilers: () => ReturnType;
      toggleInlineSpoilers: () => ReturnType;
    };
  }
}

export const InlineSpoilersPlugin = Mark.create({
  name: PLUGIN_NAME,

  addAttributes() {
    return {
      
    }
  },
})