import { toString } from "mdast-util-to-string";
import type {
  Root,
  Node,
  RootContent,
  Link,
  ListItem,
  Text,
  InlineCode,
  Code,
  Parent,
} from "mdast";

const hasChildren = (node: Node): node is Node & Parent => {
  return "children" in node && Array.isArray(node.children);
};

const hasStringValue = (
  node: Node
): node is Node & (Text | InlineCode | Code) => {
  return "value" in node && typeof node.value === "string";
};

/**
 * Serializes an inline mdast node to plain text.
 * Handles text, links, emphasis, strong, delete, inline code, and HTML nodes.
 */
const serializeInline = (node: Node): string => {
  switch (node.type) {
    case "text": {
      return toString(node).replaceAll("\n", " ");
    }
    case "break": {
      return "\n";
    }
    case "link": {
      if (!hasChildren(node)) {
        throw new Error("Link node is missing children");
      }
      const link = node as Link;
      const text = link.children
        .map((child) => serializeInline(child))
        .join("");
      if (!link.url) {
        return text;
      }
      return `${text} (${link.url})`;
    }
    case "emphasis":
    case "strong":
    case "delete": {
      if (!hasChildren(node)) {
        throw new Error(`Node ${node.type} is missing children`);
      }
      return node.children.map((child) => serializeInline(child)).join("");
    }
    case "inlineCode": {
      if (!hasStringValue(node)) {
        throw new Error(`Node ${node.type} is missing value`);
      }
      return node.value;
    }
    case "html": {
      return "";
    }
    default: {
      return toString(node).replaceAll("\n", " ");
    }
  }
};

/**
 * Serializes a block-level mdast node to plain text.
 * Handles paragraphs, lists, headings, blockquotes, and code blocks.
 */
const serializeBlock = (node: RootContent): string | null => {
  switch (node.type) {
    case "paragraph": {
      if (!hasChildren(node)) {
        return null;
      }
      const children = node.children;
      return children.map((child) => serializeInline(child)).join("");
    }
    case "list": {
      return node.children
        .map((item: ListItem) => {
          const listItemChildren = item.children;
          const textContent = listItemChildren
            .map((child) => {
              if (child.type === "paragraph") {
                return child.children
                  .map((grandChild) => serializeInline(grandChild))
                  .join("");
              }
              return serializeBlock(child as RootContent) ?? "";
            })
            .filter((value) => value.trim().length > 0)
            .join("\n");
          return textContent.length > 0 ? `- ${textContent}` : "";
        })
        .filter((value) => value.length > 0)
        .join("\n");
    }
    case "heading": {
      const children = node.children;
      return children.map((child) => serializeInline(child)).join("");
    }
    case "blockquote": {
      const parts = node.children
        .map((child) => serializeBlock(child as RootContent))
        .filter((value): value is string =>
          Boolean(value && value.trim().length > 0)
        );
      return parts.join("\n\n");
    }
    case "code": {
      return node.value;
    }
    case "thematicBreak": {
      return "---";
    }
    default: {
      console.warn(`Unknown block node type: ${node.type}`);
      throw new Error(`Unknown block node type: ${node.type}`);
    }
  }
};

export const mdastToText = (tree: Root): string => {
  return tree.children
    .map((node) => serializeBlock(node))
    .filter((text): text is string => text !== null)
    .join("\n\n");
};
