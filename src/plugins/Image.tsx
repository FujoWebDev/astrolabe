import { EyeAlt, EyeOff } from "iconoir-react";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";

import { Node } from "@tiptap/core";
import { PluginKey } from "prosemirror-state";
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
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...props,
            },
          });
        },
    };
  },
});
