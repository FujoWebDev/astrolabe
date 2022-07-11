import { EyeAlt, EyeOff } from "iconoir-react";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { PluginKey, TextSelection, Transaction } from "prosemirror-state";

import FloatingMenu from "@tiptap/extension-floating-menu";
import { Node } from "@tiptap/core";
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

const Image = ({
  src,
  alt,
  spoilers,
  editable,
  onToggleSpoilers,
}: ImageOptions & {
  editable: boolean;
  onToggleSpoilers: (spoilers: boolean) => void;
}): JSX.Element => {
  const image = (
    <img src={src} alt={alt} style={{ display: "block", maxWidth: "100%" }} />
  );
  if (!editable) {
    return image;
  }
  return (
    <div>
      <div>
        <button
          title="toggle spoilers"
          onClick={(e) => onToggleSpoilers(!spoilers)}
        >
          {spoilers ? <EyeAlt /> : <EyeOff />}
        </button>
      </div>
      {image}
    </div>
  );
};

const WrappedImage = (
  props: Partial<NodeViewProps> &
    Required<Pick<NodeViewProps, "node"> & { editable?: boolean }>
) => {
  const attributes = props.node.attrs as ImageOptions;
  return (
    <NodeViewWrapper
      data-type={PLUGIN_NAME}
      as="picture"
      data-spoilers={attributes.spoilers}
      style={{ display: "block", maxWidth: "100%" }}
    >
      <Image
        {...attributes}
        editable={props.editable ?? "true"}
        onToggleSpoilers={(spoilers) => {
          props.updateAttributes?.({
            spoilers,
          });
        }}
      />
    </NodeViewWrapper>
  );
};

export const ImagePlugin = Node.create<ImageOptions>({
  name: PLUGIN_NAME,
  group: "block",

  addAttributes() {
    return {
      src: {
        default: "",
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
      <WrappedImage node={node} editable={false} />
    );
    const element = domRoot.firstElementChild;
    if (!element) {
      throw `No element returned when rendering ${this.name}.`;
    }
    return element;
  },

  addNodeView() {
    return ReactNodeViewRenderer(WrappedImage);
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
