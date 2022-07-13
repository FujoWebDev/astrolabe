import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "./BlockSettingsMenu/BlockSettingsMenu";
import { EyeAlt, EyeOff, Trash } from "iconoir-react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { PluginKey, TextSelection, Transaction } from "prosemirror-state";

import { renderToStaticMarkup } from "react-dom/server";

export const ImagePluginKey = new PluginKey("ImagePlugin");

export interface ImageOptions {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  spoilers?: boolean;
}

const PLUGIN_NAME = "image";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      setImage: (options: ImageOptions) => ReturnType;
    };
  }
}

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

const ImageComponent = (props: ImageOptions) => {
  return (
    <picture
      data-type={PLUGIN_NAME}
      data-spoilers={props.spoilers}
      style={{ display: "block", maxWidth: "100%" }}
    >
      <img
        src={props.src}
        alt={props.alt}
        style={{ display: "block", maxWidth: "100%" }}
      />
    </picture>
  );
};

const WrappedImageComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as ImageOptions;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <ImageComponent {...attributes} />
    </NodeViewWrapper>
  );
};

const EditableImageComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as ImageOptions;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <ImageOptionsMenu
        spoilers={!!attributes.spoilers}
        onToggleSpoilers={(spoilers) =>
          props.updateAttributes?.({
            spoilers,
          })
        }
        onDeleteRequest={() => props.deleteNode?.()}
      />
      <ImageComponent
        src={attributes.src}
        alt={attributes.alt}
        spoilers={attributes.spoilers}
      />
    </NodeViewWrapper>
  );
};

const ImageOptionsMenu = (props: {
  spoilers: boolean;
  onToggleSpoilers: (spoilers: boolean) => void;
  onDeleteRequest: () => void;
}) => {
  return (
    <BlockSettingsMenu>
      <ToggleButton
        value={!!props.spoilers}
        title="toggle spoilers"
        onValueChange={props.onToggleSpoilers}
      >
        {props.spoilers ? <EyeAlt /> : <EyeOff />}
      </ToggleButton>
      <Button title="delete image" onClick={props.onDeleteRequest}>
        <Trash />
      </Button>
    </BlockSettingsMenu>
  );
};

export const ImagePlugin = Node.create<ImageOptions>({
  name: PLUGIN_NAME,
  group: "block",

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("src"),
      },
      spoilers: {
        default: false,
      },
      alt: {
        default: "no alt",
      },
    };
  },

  renderHTML({ node }) {
    const domRoot = document.createElement("div");
    domRoot.innerHTML = renderToStaticMarkup(
      // @ts-expect-error
      <ImageComponent {...node.attrs} />
    );
    const element = domRoot.firstElementChild;
    if (!element) {
      throw `No element returned when rendering ${this.name}.`;
    }
    return element;
  },

  addNodeView() {
    // TODO: file bugs to ask for ability to pass props to the components here?
    return ReactNodeViewRenderer(
      this.editor.isEditable ? EditableImageComponent : WrappedImageComponent
    );
  },

  parseHTML() {
    return [
      {
        tag: `picture[data-type=${this.name}]`,
      },
    ];
  },

  addCommands() {
    return {
      setImage:
        (props: ImageOptions) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              preserveWhitespace: true,
              attrs: {
                ...props,
              },
            })
            .command(({ tr, dispatch, editor }) => {
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
            })
            .run();
        },
    };
  },

  // TODO: if we're in edit mode and the image is the last element of the editor, make
  // sure that a paragraph stays at the end of it
  // onTransaction() {}
});
