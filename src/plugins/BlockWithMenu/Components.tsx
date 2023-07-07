import { ArrowDown, ArrowUp, EyeAlt, EyeOff, Trash } from "iconoir-react";
import {
  BlockSettingsMenuProps,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { BlockWithMenuOptions, PLUGIN_NAME } from "./Plugin";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import React from "react";
import { css } from "@linaria/core";

export interface BlockBaseMenuProps extends Partial<BlockSettingsMenuProps> {
  deleteTitle: string;
}

// TODO: debug inserting paragraph above lower of two blocks in a row
export const BlockBaseMenu = (
  props: BlockBaseMenuProps &
    Partial<NodeViewProps> &
    Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as BlockWithMenuOptions;
  const spoilers = !!attributes.spoilers;
  return (
    <ul role="menubar" className="block-menu">
      {!!props.children &&
        React.Children.map(props.children, (child) => (
          <li role="menuitem" key={child.props.title}>
            {child}
          </li>
        ))}
      <li role="menuitem">
        <ToggleButton
          value={spoilers}
          title="Toggle Spoilers"
          onValueChange={(spoilers) =>
            props.updateAttributes?.({
              spoilers,
            })
          }
        >
          {spoilers ? <EyeAlt /> : <EyeOff />}
        </ToggleButton>
      </li>
      <li role="menuitem">
        <Button
          title={`Delete ${props.deleteTitle}`}
          onClick={() => props.deleteNode?.()}
        >
          <Trash />
        </Button>
      </li>
      <li role="menuitem">
        <Button
          title="Insert Paragraph Above"
          onClick={() => {
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
        >
          Insert Paragraph <ArrowUp />
        </Button>
      </li>
      <li role="menuitem">
        <Button
          title="Insert Paragraph Below"
          onClick={() => {
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
        >
          Insert Paragraph <ArrowDown />
        </Button>
      </li>
    </ul>
  );
};

export const BlockWithMenuComponent = (
  props: BlockWithMenuOptions & { editable?: boolean }
) => {
  return (
    <div
      className="block-with-menu"
      tabIndex={props.editable || !props.spoilers ? -1 : 0}
      data-type={PLUGIN_NAME}
      data-spoilers={props.spoilers}
      data-visible={props.visible}
      data-width={props.width}
      data-height={props.height}
      style={{ width: props.width, height: props.height, maxWidth: "100%" }}
    ></div>
  );
};

export const EditableBlockWithMenuComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as BlockWithMenuOptions;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <BlockBaseMenu {...props} deleteTitle="block" />
      <BlockWithMenuComponent
        spoilers={attributes.spoilers}
        width={attributes.width}
        height={attributes.height}
      />
    </NodeViewWrapper>
  );
};
