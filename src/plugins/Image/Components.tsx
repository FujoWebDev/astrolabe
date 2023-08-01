import {
  BlockBaseComponent,
  BlockBaseMenu,
  BlockBaseProps,
} from "@bobaboard/tiptap-block-with-menu";
import { ImageOptions, PLUGIN_NAME } from "./Plugin";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { Button } from "../BlockSettingsMenu/BlockSettingsMenu";
import React from "react";
import { css } from "@linaria/core";

const imageComponentClass = css`
  picture img {
    margin: 0 auto;
  }
`;

export const ImageComponent = (
  props: BlockBaseProps & {
    onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  }
) => {
  const attributes = props.attributes;
  return (
    <BlockBaseComponent
      {...props}
      className={imageComponentClass}
      enclosingTag={"picture"}
    >
      <img
        src={attributes.src}
        alt={attributes.alt}
        style={{ display: "block", maxWidth: "100%" }}
        onLoad={props.onLoad}
      />
    </BlockBaseComponent>
  );
};

export const EditableImageComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as ImageOptions;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <BlockBaseMenu {...props} deleteTitle="Image">
        <Button
          title="set alt text"
          onClick={() => {
            const alt = window.prompt("Set alt text:", attributes.alt);
            if (!alt) {
              return;
            }
            props.updateAttributes?.({ alt });
          }}
        >
          Set Alt Text
        </Button>
      </BlockBaseMenu>
      <ImageComponent
        attributes={attributes}
        pluginName={PLUGIN_NAME}
        onLoad={(event) => {
          const image = event.target as HTMLElement;
          if (image.tagName !== "IMG") {
            return;
          }
          const rect = image.getBoundingClientRect();
          props.updateAttributes?.({ width: rect.width, height: rect.height });
        }}
      />
    </NodeViewWrapper>
  );
};
