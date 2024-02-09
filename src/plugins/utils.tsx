import { CommandProps, NodeViewProps } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TextSelection, Transaction } from "prosemirror-state";

import { Attrs } from "@tiptap/pm/model";
import { NodeViewWrapper } from "@tiptap/react";
// import { renderToStaticMarkup } from "react-dom/server";

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

export const withViewWrapper = <
  ComponentProps extends {},
  PluginOptions extends {}
>(
  pluginName: string,
  Component: (
    props: ComponentProps & { attributes: PluginOptions }
  ) => JSX.Element,
  nonAttributeProps: ComponentProps
) => {
  return (
    props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
  ) => {
    const attributes = props.node.attrs as PluginOptions;
    const allProps = { ...nonAttributeProps, attributes };
    return (
      <NodeViewWrapper data-type={pluginName}>
        <Component {...allProps} />
      </NodeViewWrapper>
    );
  };
};

export const loadToDom = <ComponentProps extends {}>(
  Component: (props: ComponentProps) => JSX.Element,
  props: ComponentProps
) => {
  const domRoot = document.createElement("div");
  // domRoot.innerHTML = renderToStaticMarkup(<Component {...props} />);
  const element = domRoot.firstElementChild;
  if (!element) {
    throw `No element returned when loading ${Component.name} to the dom.`;
  }
  return element;
};

// Because of the way ProseMirror adds event listeners, we can't use event.currentTarget
// to catch the event as it bubbles to parent, so we check the ancestors recursively
// until we find the attribute, hit the outer wrapper of the editor, or there is no parent.
const getElementOrAncestorWithAttribute = (
  element: HTMLElement | null,
  attribute: string
): HTMLElement | null => {
  if (!element || element.classList.contains("ProseMirror")) {
    return null;
  }
  if (element.hasAttribute(attribute)) {
    return element;
  }
  return getElementOrAncestorWithAttribute(element.parentElement, attribute);
};

export const toggleAttributeOnClick = ({
  name,
  attribute,
}: {
  name: string;
  attribute: string;
}) => {
  return new Plugin({
    key: new PluginKey(`update${name}AttributeOnClick`),
    props: {
      handleClickOn(view, _pos, _node, _nodePos, event) {
        if (view.editable) {
          return false;
        }
        const element = event.target as HTMLElement;
        const elementOrParent = getElementOrAncestorWithAttribute(
          element,
          attribute
        );
        if (!elementOrParent) {
          console.log(
            "neither target nor parent has html attribute",
            attribute
          );
          return false;
        }
        const currentValue = elementOrParent.getAttribute(attribute);
        if (!currentValue) {
          console.log("elementOrParent attribute has no currentValue");
          return false;
        }
        const newValue = currentValue === "false" ? "true" : "false";
        console.log(
          `toggling ${name} attribute ${attribute} from ${currentValue} to ${newValue}`
        );
        elementOrParent.setAttribute(attribute, newValue);
        return true;
      },
    },
  });
};

export const toggleSpoilersOnKeydown = (event: KeyboardEvent) => {
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
  if (
    document.activeElement?.getAttribute("data-type") !== "inlineSpoilers" &&
    !document.activeElement?.getAttribute("data-spoilers")
  ) {
    console.log("data-type", document.activeElement?.getAttribute("data-type"));
    console.log(
      "data-spoilers",
      document.activeElement?.getAttribute("data-spoilers")
    );
    console.log("activeElement", document.activeElement);
    return;
  }
  const spoilersElement = document.activeElement;
  const currentValue = spoilersElement?.getAttribute("data-visible");
  if (!currentValue) {
    console.log("data-visible has no currentValue");
    return;
  }
  const newValue = currentValue === "false" ? "true" : "false";
  console.log(`toggling data-visible from ${currentValue} to ${newValue}`);
  console.log("spoilersElement", spoilersElement);
  spoilersElement.setAttribute("data-visible", newValue);
  console.log(
    "after update, data-visible",
    spoilersElement?.getAttribute("data-visible")
  );
};

export const makeDataAttributes = (attributes: Attrs) => {
  let dataAttributes: Record<string, any> = {};
  for (const [key, value] of Object.entries(attributes)) {
    dataAttributes[`data-${key}`] = value;
  }
  return dataAttributes;
};
