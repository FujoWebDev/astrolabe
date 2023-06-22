import { CommandProps, Editor, NodeViewProps } from "@tiptap/core";
import { Node, ResolvedPos } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Selection, TextSelection, Transaction } from "prosemirror-state";

import { NodeViewWrapper } from "@tiptap/react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Return selection corresponding to the node following the inserted image.
 * If the image is not followed by another node, add a text node after it then
 * set the selection to it.
 *
 * Lifted from https://github.com/ueberdosis/tiptap/blob/main/packages/extension-horizontal-rule/src/horizontal-rule.ts#L51
 */
// TODO: this might need to be automatically added in edit mode if we're preloading
// existing content and the last element is an image.
const maybeAddNewTrailingParagraph = (tr: Transaction) => {
  const { $to } = tr.selection;
  const posAfter = $to.end();

  if ($to.nodeAfter) {
    return TextSelection.create(tr.doc, $to.pos);
  } else {
    const node = $to.parent.type.contentMatch.defaultType?.create();
    if (node) {
      tr.insert(posAfter, node);
      return TextSelection.create(tr.doc, posAfter + 1);
    }
  }
};

export const goToTrailingParagraph = ({
  tr,
  dispatch,
  editor,
}: CommandProps) => {
  if (dispatch) {
    const selection = maybeAddNewTrailingParagraph(tr);
    // Request animation frame is necessary or the focus won't actually happen.
    // see: https://github.com/ueberdosis/tiptap/issues/1520
    requestAnimationFrame(() => {
      if (!editor.isDestroyed && !editor.isFocused && selection) {
        editor.view.focus();
        editor.commands.setTextSelection(selection);
        editor.commands.scrollIntoView();
      }
    });
  }

  return true;
};

export const withViewWrapper = <PluginOptions extends {}>(
  pluginName: string,
  Component: (props: PluginOptions) => JSX.Element
) => {
  return (
    props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
  ) => {
    const attributes = props.node.attrs as PluginOptions;
    return (
      <NodeViewWrapper data-type={pluginName}>
        <Component {...attributes} />
      </NodeViewWrapper>
    );
  };
};

export const loadToDom = <PluginOptions extends {}>(
  Component: (props: PluginOptions) => JSX.Element,
  props: PluginOptions
) => {
  const domRoot = document.createElement("div");
  domRoot.innerHTML = renderToStaticMarkup(<Component {...props} />);
  const element = domRoot.firstElementChild;
  if (!element) {
    throw `No element returned when loading ${Component.name} to the dom.`;
  }
  return element;
};

export const toggleAttributeOnClick = ({
  editor,
  name,
  attribute,
}: {
  editor: Editor;
  name: string;
  attribute: string;
}) => {
  return new Plugin({
    key: new PluginKey(`update${name}AttributesOnClick`),
    props: {
      handleClickOn(view, _pos, _node, _nodePos, event) {
        if (view.editable) {
          return false;
        }
        const element = event.target as HTMLElement;
        if (!element.hasAttribute(`data-${attribute}`)) {
          console.log("target doesn't have data-attribute", attribute);
          return false;
        }
        const currentValue = element.getAttribute(`data-${attribute}`);
        if (!currentValue) {
          console.log("no currentValue");
          return false;
        }
        const newValue = currentValue === "false" ? "true" : "false";
        console.log(
          `toggling ${name} attribute ${attribute} from ${currentValue} to ${newValue}`
        );
        element.setAttribute(`data-${attribute}`, newValue);
        return true;
      },
    },
  });
};

// export const toggleAttributeOnClick = ({
//   editor,
//   name,
//   attribute,
// }: {
//   editor: Editor;
//   name: string;
//   attribute: string;
// }) => {
//   return new Plugin({
//     key: new PluginKey(`update${name}AttributesOnClick`),
//     props: {
//       handleClickOn(view, pos, node, nodePos, event) {
//         if (view.editable) {
//           return false;
//         }
//         const resolvedPos = Node.resolve(pos);
//         console.log("node", node);
//         console.log("marks", node.marks);
//         const currentValue = node.attrs[attribute];
//         if (typeof currentValue !== "boolean") {
//           console.log("currentValue", currentValue);
//           return false;
//         }
//         const newValue = !currentValue;
//         console.log(
//           `toggling ${name} attribute ${attribute} from ${currentValue} to ${newValue}`
//         );
//         editor.commands.updateAttributes(
//           name,
//           Object.fromEntries([[attribute, newValue]])
//         );
//         return true;
//       },
//     },
//   });
// };
