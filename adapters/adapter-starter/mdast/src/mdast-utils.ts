import type { JSONContent } from "@tiptap/core";
import type {
  BlockContent,
  DefinitionContent,
  Heading,
  Node,
  Nodes,
  PhrasingContent,
  Root,
  RootContent,
} from "mdast";
import { phrasing } from "mdast-util-phrasing";
import { toString } from "mdast-util-to-string";
import { is } from "unist-util-is";
import { u } from "unist-builder";
import { visit } from "unist-util-visit";
import type { ConverterMarkPlugin, ConverterPlugin } from "./plugin-utils.js";
import { applyPluginsMarks, applyPluginsNodes } from "./plugin-utils.js";

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
 * Converts a ProseMirror block-level node to an mdast node.
 * Handles paragraphs, code blocks, images, headings, blockquotes, lists, and horizontal rules.
 * Uses plugins for unknown node types.
 */
export const convertBlockNode = (
  node: JSONContent,
  previousSibling: JSONContent | undefined,
  nextSibling: JSONContent | undefined,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): RootChild => {
  switch (node.type) {
    case "paragraph": {
      const paragraphChildren: ParagraphChild[] = [];
      const inlineContent = node.content ?? [];
      for (let index = 0; index < inlineContent.length; index++) {
        const contentNode = inlineContent[index];
        paragraphChildren.push(
          ...convertInlineNode(
            contentNode,
            inlineContent[index - 1],
            inlineContent[index + 1],
            plugins
          )
        );
      }

      const normalisedChildren = normaliseParagraphChildren(
        paragraphChildren,
        previousSibling,
        nextSibling
      );

      return u("paragraph", normalisedChildren);
    }
    case "codeBlock": {
      const language =
        typeof node.attrs?.language === "string"
          ? node.attrs.language
          : undefined;
      const [firstChild] = node.content ?? [];
      const value = typeof firstChild?.text === "string" ? firstChild.text : "";

      return language ? u("code", { lang: language }, value) : u("code", value);
    }
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const title =
        typeof node.attrs?.title === "string" ? node.attrs.title : undefined;
      const alt =
        typeof node.attrs?.alt === "string" ? node.attrs.alt : undefined;

      return u("image", { url: src, title: title ?? null, alt: alt ?? null });
    }
    case "heading": {
      const depth =
        typeof node.attrs?.level === "number" ? node.attrs.level : 1;
      const paragraphChildren: ParagraphChild[] = [];
      const inlineContent = node.content ?? [];
      for (let index = 0; index < inlineContent.length; index++) {
        const contentNode = inlineContent[index];
        paragraphChildren.push(
          ...convertInlineNode(
            contentNode,
            inlineContent[index - 1],
            inlineContent[index + 1],
            plugins
          )
        );
      }

      return u(
        "heading",
        { depth: depth as Heading["depth"] },
        paragraphChildren
      );
    }
    case "blockquote": {
      const convertedChildren: RootChild[] = [];
      const blockContent = node.content ?? [];
      for (let index = 0; index < blockContent.length; index++) {
        const child = blockContent[index];
        convertedChildren.push(
          convertBlockNode(
            child,
            blockContent[index - 1],
            blockContent[index + 1],
            plugins
          )
        );
      }

      return u(
        "blockquote",
        convertedChildren.filter(isBlockOrDefinitionContent)
      );
    }
    case "bulletList": {
      const listItems = node.content ?? [];

      return u("list", { ordered: false, spread: false }, [
        ...listItems.map((item) => {
          const itemChildren: RootChild[] = [];
          const itemContent = item.content ?? [];
          for (let index = 0; index < itemContent.length; index++) {
            const child = itemContent[index];
            itemChildren.push(
              convertBlockNode(
                child,
                itemContent[index - 1],
                itemContent[index + 1],
                plugins
              )
            );
          }

          return u("listItem", itemChildren.filter(isBlockOrDefinitionContent));
        }),
      ]);
    }
    case "orderedList": {
      const listItems = node.content ?? [];
      const start =
        typeof node.attrs?.start === "number" && !Number.isNaN(node.attrs.start)
          ? node.attrs.start
          : undefined;

      return u("list", { ordered: true, spread: false, start }, [
        ...listItems.map((item) => {
          const itemChildren: RootChild[] = [];
          const itemContent = item.content ?? [];
          for (let index = 0; index < itemContent.length; index++) {
            const child = itemContent[index];
            itemChildren.push(
              convertBlockNode(
                child,
                itemContent[index - 1],
                itemContent[index + 1],
                plugins
              )
            );
          }

          return u("listItem", itemChildren.filter(isBlockOrDefinitionContent));
        }),
      ]);
    }
    case "horizontalRule": {
      return u("thematicBreak");
    }
    default: {
      const converted = applyPluginsNodes(node, plugins);
      if (!converted) {
        console.warn(`Unknown node type: ${node.type}`);
        throw new Error(`Unknown node type: ${node.type}`);
      }
      if (isRootChildNode(converted)) {
        return converted;
      }

      if (isParagraphChildNode(converted)) {
        return u("paragraph", [converted]);
      }

      throw new Error(
        `Plugin returned an unsupported node type for block context: ${converted.type}`
      );
    }
  }
};

/**
 * Converts a ProseMirror inline node to an array of mdast paragraph children.
 * Handles text nodes, hard breaks, and delegates to plugins for other inline types.
 */
export const convertInlineNode = (
  node: JSONContent,
  previousSibling: JSONContent | undefined,
  nextSibling: JSONContent | undefined,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): ParagraphChild[] => {
  if (node.type === "text") {
    return convertTextNode(node, previousSibling, nextSibling, plugins);
  }

  if (node.type === "hardBreak") {
    return [u("break")];
  }

  const converted = applyPluginsNodes(node, plugins);
  if (!converted) {
    throw new Error(`Unknown inline node type: ${node.type}`);
  }

  if (isParagraphChildNode(converted)) {
    return [converted];
  }

  if (isRootChildNode(converted)) {
    throw new Error(
      `Plugin returned a block node when inline content was expected: ${converted.type}`
    );
  }

  throw new Error(
    `Plugin returned an unsupported inline node type: ${converted.type}`
  );
};

/**
 * Converts a ProseMirror text node with marks to mdast nodes.
 * Handles bold, italic, code, underline, and link marks.
 * Uses plugins for unknown mark types.
 */
export const convertTextNode = (
  node: JSONContent,
  _previousSibling: JSONContent | undefined,
  _nextSibling: JSONContent | undefined,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): ParagraphChild[] => {
  if (typeof node.text !== "string") {
    throw new TypeError("Text node is missing textual content");
  }

  let phrasing: ParagraphChild = u("text", node.text);
  const tags: string[] = [];
  for (const mark of node.marks?.toReversed() ?? []) {
    switch (mark.type) {
      case "bold": {
        phrasing = u("strong", [phrasing]);
        break;
      }
      case "italic": {
        phrasing = u("emphasis", [phrasing]);
        break;
      }
      case "code": {
        phrasing = u("inlineCode", { value: node.text });
        break;
      }
      case "underline": {
        phrasing = u("text", toString(phrasing));
        tags.push("u");
        break;
      }
      case "link": {
        const href =
          typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        const title =
          typeof mark.attrs?.title === "string" ? mark.attrs.title : undefined;
        phrasing = u("link", { url: href, title: title ?? null }, [phrasing]);
        break;
      }
      default: {
        const converted = applyPluginsMarks(mark, node, phrasing, plugins);
        if (!converted) {
          console.warn(`Unknown mark type: ${mark.type}`);
          continue;
        }
        // TODO: figure out how to deal with nodes that aren't a single paragraph child
        if (Array.isArray(converted)) {
          console.warn(
            `Plugin returned an array of nodes, which is a case we haven't worked out yet: ${converted
              .map((node) => node.type)
              .join(", ")}`
          );
        }
        phrasing = converted as ParagraphChild;
        continue;
      }
    }
  }
  if (tags.length > 0) {
    return [
      tags.map((tag) => u("html", { value: `<${tag}>` })),
      phrasing,
      tags.map((tag) => u("html", { value: `</${tag}>` })),
    ].flat();
  }
  return [phrasing];
};
