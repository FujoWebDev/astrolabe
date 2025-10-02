import { toString } from "mdast-util-to-string";
import { u } from "unist-builder";

import {
  isParagraphChildNode,
  isRootChildNode,
  compact,
  normaliseParagraphChildren,
} from "./mdast-utils.js";
import { applyPluginsNodes, applyPluginsMarks } from "./plugin-utils.js";

import type {
  ParagraphChild,
  RootChild as MdastRootChild,
} from "./mdast-utils.js";
import type { ConverterPlugin, ConverterMarkPlugin } from "./plugin-utils.js";
import type { JSONContent, DocumentType } from "@tiptap/core";
import type { Root as MdastRoot } from "mdast";

export type ProseMirrorMark = NonNullable<JSONContent["marks"]>[number];
export type ProseMirrorNode = JSONContent;
export type ProseMirrorDocument = DocumentType;

export type { ConverterPlugin, ConverterMarkPlugin } from "./plugin-utils.js";

const isDocument = (root: unknown): root is DocumentType =>
  typeof root === "object" &&
  root !== null &&
  "type" in root &&
  root.type === "doc";

export const convert = (
  root: unknown,
  options?: {
    plugins?: (ConverterPlugin | ConverterMarkPlugin)[];
  }
): MdastRoot => {
  if (!isDocument(root)) {
    throw new Error("Root type is not doc");
  }

  const plugins = options?.plugins ?? [];

  // We're forgiving if the root has no children
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!root.content) {
    return u("root", []);
  }
  const content = root.content;

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

const convertBlockNode = (
  node: JSONContent,
  previousSibling: JSONContent | undefined,
  nextSibling: JSONContent | undefined,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): MdastRootChild => {
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

const convertInlineNode = (
  node: JSONContent,
  previousSibling: JSONContent | undefined,
  nextSibling: JSONContent | undefined,
  plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[]
): ParagraphChild[] => {
  if (node.type === "text") {
    return convertTextNode(node, previousSibling, nextSibling, plugins);
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

const convertTextNode = (
  node: JSONContent,
  previousSibling: JSONContent | undefined,
  nextSibling: JSONContent | undefined,
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
        const converted = applyPluginsMarks(mark, node, plugins);
        if (!converted) {
          console.warn(`Unknown mark type: ${mark.type}`);
          continue;
        }
        if (isParagraphChildNode(converted)) {
          phrasing = converted;
          continue;
        }
        throw new Error(
          `Plugin returned an unsupported mark type: ${converted.type}`
        );
      }
    }
  }
  if (tags.length > 0) {
    return [
      tags.map((tag) => u("html", { value: "<" + tag + ">" })),
      phrasing,
      tags.map((tag) => u("html", { value: "</" + tag + ">" })),
    ].flat();
  }
  return [phrasing];
};
