import { InlineSpoilersOptions, PLUGIN_NAME } from "./Plugin";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import React from "react";

export const EditableInlineSpoilersComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME} as="span">
      <span
        data-type={PLUGIN_NAME}
        aria-label="text spoilers"
        className="inline-spoilers"
        data-visible={attributes.visible}
      >
        <NodeViewContent as="span" />
      </span>
    </NodeViewWrapper>
  );
};

export const InlineSpoilerComponent = (
  props: Partial<NodeViewProps> &
    Required<Pick<NodeViewProps, "node" | "updateAttributes">>
) => {
  const attributes = props.node.attrs;
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME} as="span">
      <button
        data-type={PLUGIN_NAME}
        aria-label="text spoilers"
        className="inline-spoilers"
        data-visible={attributes.visible}
        // onClick={(e) => {
        //   const currentVisibility =
        //     e.currentTarget.getAttribute("data-visible");
        //   e.currentTarget.setAttribute(
        //     "data-visible",
        //     currentVisibility === "false" ? "true" : "false"
        //   );
        // }}
        onClick={() => {
          console.log(
            "updating inline spoiler attribute visible",
            attributes.visible
          );
          props.updateAttributes({
            visible: attributes.visible == false ? true : false,
          });
        }}
      >
        <NodeViewContent as="span" />
      </button>
    </NodeViewWrapper>
  );
};
