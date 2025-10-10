import type { ProseMirrorMark } from "./index.js";
import type { JSONContent } from "@tiptap/core";
import type { Nodes as MdastNodes } from "mdast";

export interface ConverterContext {
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[];
}

export interface ConverterPlugin {
  pluginType: "converter-node";
  convert: (node: JSONContent, context: ConverterContext) => MdastNodes;
  handlesNode: (node: JSONContent) => boolean;
}

export interface ConverterMarkPlugin {
  pluginType: "converter-mark";
  convert: (
    mark: ProseMirrorMark,
    node: JSONContent,
    context: ConverterContext
  ) => MdastNodes;
  handlesMark: (mark: ProseMirrorMark) => boolean;
}

/**
 * Applies converter plugins to a ProseMirror node.
 * Iterates through plugins to find one that handles the given node type.
 * @returns The converted mdast node, or undefined if no plugin handles it.
 */
export const applyPluginsNodes = (
  node: JSONContent,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): MdastNodes | undefined => {
  for (const plugin of plugins) {
    if (plugin.pluginType !== "converter-node" || !plugin.handlesNode(node)) {
      continue;
    }

    return plugin.convert(node, { plugins });
  }

  return undefined;
};

/**
 * Applies converter plugins to a ProseMirror mark.
 * Iterates through plugins to find one that handles the given mark type.
 * @returns The converted mdast node, or undefined if no plugin handles it.
 */
export const applyPluginsMarks = (
  mark: ProseMirrorMark,
  node: JSONContent,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): MdastNodes | undefined => {
  for (const plugin of plugins) {
    if (plugin.pluginType !== "converter-mark" || !plugin.handlesMark(mark)) {
      continue;
    }

    return plugin.convert(mark, node, { plugins });
  }

  return undefined;
};
