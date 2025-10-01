import { Plugin, PluginKey } from "@tiptap/pm/state";

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
