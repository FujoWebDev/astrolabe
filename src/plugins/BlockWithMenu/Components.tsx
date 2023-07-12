import { ArrowDown, ArrowUp, EyeAlt, EyeOff, Trash } from "iconoir-react";
import {
  BlockSettingsMenuProps,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { BlockWithMenuOptions, PLUGIN_NAME } from "./Plugin";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { Attrs } from "@tiptap/pm/model";
import React from "react";
import { css } from "@linaria/core";
import { makeDataAttributes } from "../utils";

export interface BlockBaseMenuProps extends Partial<BlockSettingsMenuProps> {
  deleteTitle: string;
}

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
                .insertContentAt(props.getPos(), "<p></p>", {
                  updateSelection: true,
                })
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

export interface BlockBaseProps {
  pluginName: string;
  attributes: Attrs;
  children?: React.ReactNode;
  enclosingTag?: React.ElementType;
  editable?: boolean;
  className?: string;
}

export const BlockBaseComponent = (props: BlockBaseProps) => {
  const attributes = props.attributes;
  const Tag = props.enclosingTag ?? "div";
  const dataAttributes = makeDataAttributes(attributes);
  return (
    <Tag
      className={props.className ?? "base-block"}
      tabIndex={props.editable || !attributes.spoilers ? -1 : 0}
      data-type={props.pluginName}
      {...dataAttributes}
      style={{
        width: attributes.width,
        height: attributes.height,
        display: "block",
        maxWidth: "100%",
      }}
    >
      {props.children}
    </Tag>
  );
};

export const EditableBlockWithMenuComponent = (
  props: Partial<NodeViewProps> &
    Required<Pick<NodeViewProps, "node" | "editor">>
) => {
  const attributes = props.node.attrs as BlockWithMenuOptions;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <BlockBaseMenu {...props} deleteTitle="block">
        <Button
          title="set width"
          onClick={() => {
            const width = window.prompt("set width:");
            if (!width) {
              return;
            }
            props.updateAttributes?.({ width: parseFloat(width) });
          }}
        >
          width
        </Button>
        <Button
          title="set height"
          onClick={() => {
            const height = window.prompt("set height:");
            if (!height) {
              return;
            }
            props.updateAttributes?.({ height: parseFloat(height) });
          }}
        >
          height
        </Button>
      </BlockBaseMenu>
      <BlockBaseComponent pluginName={PLUGIN_NAME} attributes={attributes} />
    </NodeViewWrapper>
  );
};
