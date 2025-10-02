import type { ProseMirrorMark } from "./index.js";
import type { JSONContent } from "@tiptap/core";
import type { Nodes as MdastNodes } from "mdast";

export interface ConverterPlugin {
  pluginType: "converter-node";
  convert: (node: JSONContent) => MdastNodes;
  handlesNode: (node: JSONContent) => boolean;
}

export interface ConverterMarkPlugin {
  pluginType: "converter-mark";
  convert: (mark: ProseMirrorMark, node: JSONContent) => MdastNodes;
  handlesMark: (mark: ProseMirrorMark) => boolean;
}

export const applyPluginsNodes = (
  node: JSONContent,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): MdastNodes | undefined => {
  for (const plugin of plugins) {
    if (plugin.pluginType !== "converter-node" || !plugin.handlesNode(node)) {
      continue;
    }

    return plugin.convert(node);
  }

  return undefined;
};

export const applyPluginsMarks = (
  mark: ProseMirrorMark,
  node: JSONContent,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): MdastNodes | undefined => {
  for (const plugin of plugins) {
    if (plugin.pluginType !== "converter-mark" || !plugin.handlesMark(mark)) {
      continue;
    }

    return plugin.convert(mark, node);
  }

  return undefined;
};
