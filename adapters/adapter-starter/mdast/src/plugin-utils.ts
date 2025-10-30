import type { JSONContent } from "@tiptap/core";
import type { Nodes as MdastNodes, Root } from "mdast";
import type { ProseMirrorMark } from "./index.js";

export interface ConverterContext {
  plugins: readonly (
    | ConverterPlugin
    | ConverterMarkPlugin
    | TreeTransformPlugin
  )[];
}

export interface TreeTransformContext {
  plugins: readonly (
    | ConverterPlugin
    | ConverterMarkPlugin
    | TreeTransformPlugin
  )[];
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
    currentNode: MdastNodes,
    context: ConverterContext
  ) => MdastNodes;
  handlesMark: (mark: ProseMirrorMark) => boolean;
}

/**
 * Tree-level transformation plugin for operating on entire document trees.
 * Can split a single tree into multiple trees (e.g., thread breaks) or
 * transform the tree structure before/after node conversion.
 *
 * This transformation can be applied:
 * - "pre": Before converting JSONContent to mdast (operates on JSONContent)
 * - "post": After converting to mdast (operates on mdast Root)
 *
 */
export type TreeTransformPlugin = {
  pluginType: "tree-transform";
} & (
  | {
      phase: "pre";
      transform: (
        tree: JSONContent,
        context: TreeTransformContext
      ) => JSONContent | JSONContent[] | null;
    }
  | {
      phase: "post";
      transform: (
        trees: Root[],
        context: TreeTransformContext
      ) => Root | Root[] | null;
    }
);

/**
 * Applies converter plugins to a ProseMirror node.
 * Iterates through plugins to find one that handles the given node type.
 * @returns The converted mdast node, or undefined if no plugin handles it.
 */
export const applyPluginsNodes = (
  node: JSONContent,
  plugins: readonly (
    | ConverterPlugin
    | ConverterMarkPlugin
    | TreeTransformPlugin
  )[]
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
  currentNode: MdastNodes,
  plugins: readonly (
    | ConverterPlugin
    | ConverterMarkPlugin
    | TreeTransformPlugin
  )[]
): MdastNodes | undefined => {
  for (const plugin of plugins) {
    if (plugin.pluginType !== "converter-mark" || !plugin.handlesMark(mark)) {
      continue;
    }

    return plugin.convert(mark, node, currentNode, { plugins });
  }

  return undefined;
};
