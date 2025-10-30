import type { JSONContent } from "@tiptap/core";
import type {
  BlockContent,
  DefinitionContent,
  Node,
  Nodes,
  PhrasingContent,
  Root,
  RootContent,
} from "mdast";
import { phrasing } from "mdast-util-phrasing";
import { is } from "unist-util-is";
import { visit } from "unist-util-visit";
import type {
  ConverterPlugin,
  ConverterMarkPlugin,
  TreeTransformPlugin,
} from "./plugin-utils.js";

export type ParagraphChild = PhrasingContent;
export type RootChild = RootContent;

export const rootNodeTypes = new Set<RootChild["type"]>([
  "blockquote",
  "code",
  "definition",
  "footnoteDefinition",
  "heading",
  "html",
  "list",
  "paragraph",
  "table",
  "thematicBreak",
]);

export const isRootChildNode = (node: Node): node is RootChild =>
  is(node, [...rootNodeTypes]);

export const isParagraphChildNode = (node: Node): node is ParagraphChild =>
  phrasing(node);

const blockContentTypes = new Set<BlockContent["type"]>([
  "blockquote",
  "code",
  "heading",
  "html",
  "list",
  "paragraph",
  "table",
  "thematicBreak",
]);

const definitionContentTypes = new Set<DefinitionContent["type"]>([
  "definition",
  "footnoteDefinition",
]);

export const isBlockOrDefinitionContent = (
  node: RootChild
): node is BlockContent | DefinitionContent => {
  return (
    blockContentTypes.has(node.type as BlockContent["type"]) ||
    definitionContentTypes.has(node.type as DefinitionContent["type"])
  );
};

const mergeableNodeTypes = new Set([
  "text",
  "blockquote",
  "strong",
  "emphasis",
  "delete",
  "inlineCode",
  "html",
  "link",
  "linkReference",
  "image",
  "imageReference",
  "footnoteReference",
]);

const noOpTagPattern = /<(\w+)\s*>\s*<\/\1>/i; // <div></div> or other tag with nothing inside
const openCloseTagPattern = /<\/(\w+)\s*>\s*<\1>/i; // </div><div> where a tag is open and closed immediately after

const hasOnlyNoOpTags = (
  previous: PhrasingContent,
  current: PhrasingContent
): boolean => {
  if (!("value" in previous) || !("value" in current)) {
    return false;
  }

  let fullValue = (previous.value + current.value).trim();

  while (
    noOpTagPattern.test(fullValue) ||
    openCloseTagPattern.test(fullValue)
  ) {
    // TODO: this might capture both patterns if one is found and then the other
    // gets triggered, but it ends up working for our use case. Just maybe we
    // should do this right.
    fullValue = fullValue.replace(noOpTagPattern, "");
    fullValue = fullValue.replace(openCloseTagPattern, "");
  }

  return fullValue.length === 0;
};

interface PluginMetadata {
  mergeAdjacentInlineNodes?: boolean;
}
declare module "mdast" {
  interface Data {
    astrolabe?: PluginMetadata;
  }
}
/**
 * Make an mdast tree compact by merging adjacent text nodes and block quotes.
 */
export function compact(tree: Nodes) {
  visit(tree, (child, index, parent) => {
    if (
      parent &&
      index &&
      (mergeableNodeTypes.has(child.type) ||
        child.data?.astrolabe?.mergeAdjacentInlineNodes)
    ) {
      const previous = parent.children[index - 1];

      if (previous.type !== child.type) {
        return;
      }

      if (
        previous.type === "html" &&
        child.type === "html" &&
        hasOnlyNoOpTags(previous, child)
      ) {
        // If the previous node has the same closing tags that are being opened by the current node
        // we remove both nodes
        parent.children.splice(index - 1, 2);
        return index - 1;
      }

      if (
        "value" in child &&
        typeof child.value === "string" &&
        "value" in previous &&
        typeof previous.value === "string"
      ) {
        previous.value += child.value;
      }

      if (
        "children" in child &&
        Array.isArray(child.children) &&
        "children" in previous &&
        Array.isArray(previous.children)
      ) {
        // @ts-expect-error we assume the content in the childrens are
        // all compatible
        previous.children = [...previous.children, ...child.children];
      }

      if (previous.position && child.position) {
        previous.position.end = child.position.end;
      }

      parent.children.splice(index, 1);

      if (
        child.data &&
        "mergeAdjacentInlineNodes" in (child.data.astrolabe ?? {})
      ) {
        delete child.data?.astrolabe?.mergeAdjacentInlineNodes;
      }
      if (Object.keys(child.data?.astrolabe ?? {}).length === 0) {
        delete child.data?.astrolabe;
      }

      return index;
    }
  });
}

export const blockTypes = new Set<JSONContent["type"]>([
  "codeBlock",
  "heading",
  "blockquote",
  "list",
  "table",
]);

/**
 * In mdast, the first child of a paragraph directly following a block node
 * should not have leading whitespace. Similarly, the last child of a paragraph
 * directly preceding a block node should not have trailing whitespace.
 *
 * This function normalises the children of a paragraph to ensure that this is
 * the case.
 */
export const normaliseParagraphChildren = (
  children: ParagraphChild[],
  previousSibling: JSONContent | undefined,
  nextSibling: JSONContent | undefined
): ParagraphChild[] => {
  if (children.length === 0) {
    return children;
  }

  const firstChild = children[0];
  const isAfterBlock = previousSibling && blockTypes.has(previousSibling.type);
  if (isAfterBlock && firstChild && "value" in firstChild) {
    firstChild.value = firstChild.value.trimStart();
  }

  const lastChild = children.at(-1);
  const isBeforeBlock = nextSibling && blockTypes.has(nextSibling.type);
  if (isBeforeBlock && lastChild && "value" in lastChild) {
    lastChild.value = lastChild.value.trimEnd();
  }

  return children.filter(
    (child) => child.type !== "text" || child.value.length > 0
  );
};

/**
 * Converts JSONContent to mdast with full plugin pipeline.
 * Supports tree-level transformations that can split a single document into multiple trees.
 *
 * Phases:
 * 1. Pre-transform: TreeTransformPlugins with phase="pre" (operate on JSONContent)
 * 2. Node/Mark conversion: Standard ConverterPlugin and ConverterMarkPlugin
 * 3. Post-transform: TreeTransformPlugins with phase="post" (operate on mdast Root)
 */
export const convertWithPlugins = (
  input: JSONContent,
  convertToMdast: (
    input: JSONContent,
    context: {
      plugins: readonly (
        | ConverterPlugin
        | ConverterMarkPlugin
        | TreeTransformPlugin
      )[];
    }
  ) => Root,
  plugins: readonly (
    | ConverterPlugin
    | ConverterMarkPlugin
    | TreeTransformPlugin
  )[]
): Root[] => {
  const treePlugins = plugins.filter(
    (p): p is TreeTransformPlugin => p.pluginType === "tree-transform"
  );
  const preTreePlugins = treePlugins.filter((p) => p.phase === "pre");
  const postTreePlugins = treePlugins.filter((p) => p.phase === "post");

  const metadata: Record<string, unknown> = {};

  // Phase 1: Pre-transform (operate on JSONContent)
  let preProcessed: JSONContent | JSONContent[] = input;
  for (const plugin of preTreePlugins) {
    const result = plugin.transform(preProcessed, { plugins });
    if (result === null || result === undefined) {
      return [];
    }
    preProcessed = result as JSONContent | JSONContent[];
  }

  // Normalize to array
  const inputTrees = Array.isArray(preProcessed)
    ? preProcessed
    : [preProcessed];

  // Phase 2: Standard node/mark conversion
  const convertedTrees = inputTrees.map((tree) =>
    convertToMdast(tree, {
      plugins,
    })
  );

  // Phase 3: Post-transform (operate on each mdast Root)
  let postProcessed: Root[] = convertedTrees;
  for (const plugin of postTreePlugins) {
    const result = plugin.transform(postProcessed, { plugins });
    if (result === null || result === undefined) {
      postProcessed = [];
    } else {
      postProcessed = Array.isArray(result) ? result : [result];
    }
  }

  return postProcessed;
};
