import { TextSelection, Transaction } from "prosemirror-state";

import { CommandProps } from "@tiptap/core";

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

export const goToTrailingPragraph = ({
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
