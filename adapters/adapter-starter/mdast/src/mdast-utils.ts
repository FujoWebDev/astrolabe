import { phrasing } from "mdast-util-phrasing";
import { is } from "unist-util-is";
import { visit } from "unist-util-visit";

import type { JSONContent } from "@tiptap/core";
import type {
  Node,
  RootContent,
  PhrasingContent,
  Nodes,
  BlockContent,
  DefinitionContent,
} from "mdast";

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

/**
 * Make an mdast tree compact by merging adjacent text nodes and block quotes.
 *
 * @param {MdastNodes} tree
 *   Tree to change.
 * @returns {undefined}
 *   Nothing.
 */
export function compact(tree: Nodes) {
  visit(tree, function (child, index, parent) {
    if (parent && index && mergeableNodeTypes.has(child.type)) {
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
