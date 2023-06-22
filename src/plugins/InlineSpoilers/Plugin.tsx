import {
  EditableInlineSpoilersComponent,
  InlineSpoilerComponent,
} from "./Components";
import { Mark, Node, getAttributes, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// import { setBlockType } from "@tiptap/pm";
import { toggleAttributeOnClick, withViewWrapper } from "../utils";

import { ReactNodeViewRenderer } from "@tiptap/react";
import { updateAttributes } from "@tiptap/core/dist/packages/core/src/commands";

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
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setInlineSpoilers:
        (attributes) =>
        ({ commands }) => {
          console.log("in setInlineSpoilers");
          return commands.setMark(this.name, attributes);
        },
      toggleInlineSpoilers:
        (attributes) =>
        ({ commands, editor }) => {
          console.log("in toggleInlineSpoilers");
          // console.log(
          //   "can toggleWrap?",
          //   editor.can().toggleWrap(this.name, attributes)
          // );
          return commands.toggleMark(this.name, attributes);
        },
      unsetInlineSpoilers:
        () =>
        ({ commands, editor }) => {
          console.log("in unsetInlineSpoilers");
          // console.log("can lift?", this.editor.can().lift(this.name));
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      toggleAttributeOnClick({
        editor: this.editor,
        name: this.name,
        attribute: "visible",
      }),
    ];
  },
});
// export const InlineSpoilersPlugin = Node.create<InlineSpoilersOptions>({
//   name: PLUGIN_NAME,
//   group: "inline",
//   inline: true,
//   content: "inline*",
//   marks: "_",

//   addAttributes() {
//     return {
//       visible: {
//         default: false,
//         parseHTML: (element) => element.getAttribute("data-visible"),
//         renderHTML: (attributes) => {
//           return {
//             "data-visible": attributes.visible,
//           };
//         },
//       },
//     };
//   },

//   parseHTML() {
//     return [
//       {
//         tag: `span[data-type=${this.name}]`,
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return [
//       "span",
//       mergeAttributes(HTMLAttributes, {
//         "data-type": this.name,
//       }),
//       0,
//     ];
//   },

//   addNodeView() {
//     return ReactNodeViewRenderer(
//       this.editor.isEditable
//         ? EditableInlineSpoilersComponent
//         : InlineSpoilerComponent
//     );
//   },

//   addCommands() {
//     return {
//       setInlineSpoilers:
//         (attributes) =>
//         ({ commands, editor, chain, tr, state, dispatch }) => {
//           console.log("in setInlineSpoilers");
//           console.log(
//             "can setNode?",
//             editor.can().setNode(this.name, attributes)
//           );
//           const content = tr.selection.content();
//           console.log("selection content", content);
//           // state.schema.node(this.name, null, content)
//           // tr.replaceSelectionWith()
//           // return chain().splitBlock().wrapIn(this.name, attributes).run();
//           // const setSpoilers = setBlockType();
//           if (dispatch) {
//             tr.setBlockType(
//               tr.selection.from,
//               tr.selection.to,
//               this.type,
//               attributes
//             );
//           }
//           return true;
//         },
//       toggleInlineSpoilers:
//         (attributes) =>
//         ({ commands, editor }) => {
//           console.log("in toggleInlineSpoilers");
//           console.log(
//             "can toggleWrap?",
//             editor.can().toggleWrap(this.name, attributes)
//           );
//           return commands.toggleWrap(this.name, attributes);
//         },
//       unsetInlineSpoilers:
//         () =>
//         ({ commands, editor }) => {
//           console.log("in unsetInlineSpoilers");
//           console.log("can lift?", this.editor.can().lift(this.name));
//           return commands.lift(this.name);
//         },
//     };
//   },
// });
