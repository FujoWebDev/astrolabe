import type { DocumentType, JSONContent } from "@tiptap/core";
import type { Root as MdastRoot } from "mdast";
import { u } from "unist-builder";

import type { RootChild as MdastRootChild } from "./mdast-utils.js";
import { compact, convertBlockNode } from "./mdast-utils.js";
import type {
  ConverterMarkPlugin,
  ConverterPlugin,
  TreeTransformPlugin,
  PluginContext,
} from "./plugin-utils.js";

export type ProseMirrorMark = NonNullable<JSONContent["marks"]>[number];
export type ProseMirrorNode = JSONContent;
export type ProseMirrorDocument = DocumentType;

export type {
  PluginContext,
  ConverterMarkPlugin,
  ConverterPlugin,
  TreeTransformPlugin,
  PluginMetadataInput,
  PluginMetadataOutput,
} from "./plugin-utils.js";

const isDocument = (root: unknown): root is DocumentType =>
  typeof root === "object" &&
  root !== null &&
  "type" in root &&
  root.type === "doc";

const hasContent = (root: unknown): root is { content?: JSONContent[] } =>
  typeof root === "object" && root !== null && "content" in root;

/**
 * Converts a ProseMirror document to an mdast tree. Handles node and mark
 * conversion only—no tree transforms or async plugins. This is mostly for
 * use in other plugins that don't need the full pipeline. Others should
 * prefer `convert()` below.
 */
export const toMdast = (
  root: unknown,
  options?: {
    plugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
    acceptPartial?: boolean;
  }
): MdastRoot => {
  const plugins = options?.plugins ?? [];

  let content: JSONContent[];

  if (options?.acceptPartial) {
    if (!hasContent(root)) {
      return u("root", []);
    }
    content = root.content ?? [];
  } else {
    if (!isDocument(root)) {
      throw new Error("Root type is not doc");
    }
    // We're forgiving if the root has no children
    content = root.content ?? [];
  }

  const convertedChildren: MdastRootChild[] = [];
  for (let index = 0; index < content.length; index++) {
    const node = content[index];
    convertedChildren.push(
      convertBlockNode(node, content[index - 1], content[index + 1], plugins)
    );
  }

  const candidateRoot = u("root", convertedChildren);

  compact(candidateRoot);
  return candidateRoot;
};

export interface ConvertOptions {
  plugins?: readonly (
    | ConverterPlugin
    | ConverterMarkPlugin
    | TreeTransformPlugin
  )[];
}

export interface ConvertResult {
  trees: MdastRoot[];
  context: PluginContext;
}

/**
 * Converts JSONContent to mdast with full plugin pipeline.
 * Supports tree-level transformations that can, for example, split a single document
 * into multiple trees or upload images before returning the final tree(s).
 *
 * Phases:
 * 1. Pre-transform: TreeTransformPlugins with phase="pre" (operate on JSONContent)
 * 2. Node/Mark conversion: Standard ConverterPlugin and ConverterMarkPlugin
 * 3. Post-transform: TreeTransformPlugins with phase="post" (operate on mdast Root)
 */
export const convert = async (
  input: JSONContent,
  options?: ConvertOptions
): Promise<ConvertResult> => {
  const plugins = options?.plugins ?? [];

  const treePlugins = plugins.filter(
    (p): p is TreeTransformPlugin => p.pluginType === "tree-transform"
  );
  const converterPlugins = plugins.filter(
    (p): p is ConverterPlugin | ConverterMarkPlugin =>
      p.pluginType === "converter-node" || p.pluginType === "converter-mark"
  );
  const preTreePlugins = treePlugins.filter((p) => p.phase === "pre");
  const postTreePlugins = treePlugins.filter((p) => p.phase === "post");

  const context = {
    plugins,
    meta: { output: {} },
  } satisfies PluginContext;

  // Phase 1: Pre-transform (JSONContent => JSONContent, possibly array)
  let preProcessed: JSONContent | JSONContent[] = input;
  for (const plugin of preTreePlugins) {
    const result = await plugin.transform(preProcessed, context);
    if (result === null || result === undefined) {
      return { trees: [], context };
    }
    preProcessed = result as JSONContent | JSONContent[];
  }

  // To make the rest of the processing easier, we just turn everything
  // into an array regardless.
  const inputTrees = Array.isArray(preProcessed)
    ? preProcessed
    : [preProcessed];

  // Phase 2: Standard node/mark conversion
  const convertedTrees = inputTrees.map((tree) =>
    toMdast(tree, { plugins: converterPlugins })
  );

  // Phase 3: Post-transform (operate on each mdast Root, returns a
  // new mdast and potentially metadata)
  let postProcessed: MdastRoot[] = convertedTrees;
  for (const plugin of postTreePlugins) {
    const result = await plugin.transform(postProcessed, context);
    if (result === null || result === undefined) {
      postProcessed = [];
    } else {
      postProcessed = Array.isArray(result) ? result : [result];
    }
  }

  return { trees: postProcessed, context };
};
