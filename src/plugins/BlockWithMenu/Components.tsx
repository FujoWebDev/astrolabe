import { ArrowDown, ArrowUp, EyeAlt, EyeOff, Trash } from "iconoir-react";
import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { BlockWithMenuOptions, PLUGIN_NAME } from "./Plugin";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import React from "react";
import { css } from "@linaria/core";

const OptionsMenu = (props: {
  spoilers: boolean;
  onToggleSpoilers: (spoilers: boolean) => void;
  onDeleteRequest: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
}) => {
  return (
    <BlockSettingsMenu>
      <ToggleButton
        value={!!props.spoilers}
        title="Toggle Spoilers"
        onValueChange={props.onToggleSpoilers}
      >
        {props.spoilers ? <EyeAlt /> : <EyeOff />}
      </ToggleButton>
      <Button title="Delete Image" onClick={props.onDeleteRequest}>
        <Trash />
      </Button>
      <Button title="Insert Paragraph Above" onClick={props.onInsertAbove}>
        Insert Paragraph <ArrowUp />
      </Button>
      <Button title="Insert Paragraph Below" onClick={props.onInsertBelow}>
        Insert Paragraph <ArrowDown />
      </Button>
    </BlockSettingsMenu>
  );
};

const blockComponentClass = css`
  div {
    margin: 0 auto;
  }
`;

export const BlockWithMenuComponent = (props: BlockWithMenuOptions) => {
  return (
    <div
      className={blockComponentClass}
      data-type={PLUGIN_NAME}
      data-spoilers={props.spoilers}
      style={{ display: "block", maxWidth: "100%" }}
    ></div>
  );
};

export const EditableBlockWithMenuComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as BlockWithMenuOptions;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <OptionsMenu
        spoilers={!!attributes.spoilers}
        onToggleSpoilers={(spoilers) =>
          props.updateAttributes?.({
            spoilers,
          })
        }
        onDeleteRequest={() => props.deleteNode?.()}
        onInsertAbove={() => {
          if (props.getPos) {
            props.editor
              ?.chain()
              .insertContentAt(
                props.getPos() > 0 ? props.getPos() - 1 : 0,
                "<p></p>",
                {
                  updateSelection: true,
                }
              )
              .focus()
              .run();
          }
        }}
        onInsertBelow={() => {
          if (props.getPos) {
            props.editor
              ?.chain()
              .insertContentAt(props.getPos() + 1, "<p></p>", {
                updateSelection: true,
              })
              .focus()
              .run();
          }
        }}
      />
      <BlockWithMenuComponent spoilers={attributes.spoilers} />
    </NodeViewWrapper>
  );
};
