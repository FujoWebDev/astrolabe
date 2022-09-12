import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { EyeAlt, EyeOff, Trash } from "iconoir-react";
import { ImageOptions, PLUGIN_NAME } from "./Plugin";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import React from "react";
import { css } from "@linaria/core";

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

const imageComponentClass = css`
  picture img {
    margin: 0 auto;
  }
`;

export const ImageComponent = (props: ImageOptions) => {
  return (
    <picture
      className={imageComponentClass}
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

export const EditableImageComponent = (
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
