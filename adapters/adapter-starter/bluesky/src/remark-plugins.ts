import { visit } from "unist-util-visit";
import type { Root, Link, InlineCode, Code, Parent, Text } from "mdast";

export function toMonospaceEscaped(text: string) {
  const escapeMap: Record<string, string> = {
    a: "\uD835\uDE8A",
    b: "\uD835\uDE8B",
    c: "\uD835\uDE8C",
    d: "\uD835\uDE8D",
    e: "\uD835\uDE8E",
    f: "\uD835\uDE8F",
    g: "\uD835\uDE90",
    h: "\uD835\uDE91",
    i: "\uD835\uDE92",
    j: "\uD835\uDE93",
    k: "\uD835\uDE94",
    l: "\uD835\uDE95",
    m: "\uD835\uDE96",
    n: "\uD835\uDE97",
    o: "\uD835\uDE98",
    p: "\uD835\uDE99",
    q: "\uD835\uDE9A",
    r: "\uD835\uDE9B",
    s: "\uD835\uDE9C",
    t: "\uD835\uDE9D",
    u: "\uD835\uDE9E",
    v: "\uD835\uDE9F",
    w: "\uD835\uDEA0",
    x: "\uD835\uDEA1",
    y: "\uD835\uDEA2",
    z: "\uD835\uDEA3",

    A: "\uD835\uDE70",
    B: "\uD835\uDE71",
    C: "\uD835\uDE72",
    D: "\uD835\uDE73",
    E: "\uD835\uDE74",
    F: "\uD835\uDE75",
    G: "\uD835\uDE76",
    H: "\uD835\uDE77",
    I: "\uD835\uDE78",
    J: "\uD835\uDE79",
    K: "\uD835\uDE7A",
    L: "\uD835\uDE7B",
    M: "\uD835\uDE7C",
    N: "\uD835\uDE7D",
    O: "\uD835\uDE7E",
    P: "\uD835\uDE7F",
    Q: "\uD835\uDE80",
    R: "\uD835\uDE81",
    S: "\uD835\uDE82",
    T: "\uD835\uDE83",
    U: "\uD835\uDE84",
    V: "\uD835\uDE85",
    W: "\uD835\uDE86",
    X: "\uD835\uDE87",
    Y: "\uD835\uDE88",
    Z: "\uD835\uDE89",
  };

  let result = "";
  for (const char of text) {
    result += escapeMap[char] ?? char;
  }
  return result;
}

export type RemarkPlugin = (tree: Root, options?: any) => void;

/**
 * Transforms link nodes into plain text by appending the URL in parentheses.
 * Converts `[text](url)` format into `text (url)` for platforms that don't support rich links.
 */
export const remarkExpandLinks: RemarkPlugin = (tree: Root) => {
  visit(tree, "link", (node: Link, index, parent) => {
    if (!parent || index === undefined) return;

    const linkText = node.children
      .map((child) => {
        if (child.type === "text") return child.value;
        if (child.type === "inlineCode") return child.value;
        return "";
      })
      .join("");

    if (!node.url) {
      return;
    }

    (parent as Parent).children[index] = {
      type: "text",
      value: `${linkText} (${node.url})`,
    } as Text;
  });
};

/**
 * Converts inline code and code blocks to monospace Unicode characters.
 * Uses mathematical monospace Unicode characters (U+1D670-U+1D6A3) to preserve
 * code formatting in plain text environments that don't support native code styling.
 */
export const remarkMonospaceCode: RemarkPlugin = (tree: Root) => {
  visit(
    tree,
    (node): node is InlineCode | Code =>
      ["inlineCode", "code"].includes(node.type),
    (node: InlineCode | Code, index, parent) => {
      if (!parent || index === undefined) return;

      const escaped = toMonospaceEscaped(node.value);

      // Code blocks (block-level) need to be wrapped in a paragraph
      if (node.type === "code") {
        (parent as Parent).children[index] = {
          type: "paragraph",
          children: [
            {
              type: "text",
              value: escaped,
            } as Text,
          ],
        };
      } else {
        // Inline code can be replaced directly
        (parent as Parent).children[index] = {
          type: "text",
          value: escaped,
        } as Text;
      }
    }
  );
};

/**
 * Transforms the first H1 heading into bracketed format: [Title].
 *
 * Optionally merges the H1 with the following paragraph to produce "[Title]
 * Body text" instead of "[Title]\n\nBody text".
 */
export const remarkBracketHeading = (options?: {
  mergeParagraph?: boolean;
}): RemarkPlugin => {
  const mergeParagraph = options?.mergeParagraph ?? true;

  return (tree: Root) => {
    // Check if first node is an H1
    const firstNode = tree.children[0];
    if (!firstNode || firstNode.type !== "heading" || firstNode.depth !== 1) {
      return;
    }

    // Extract text from the heading
    const headingText = firstNode.children
      .map((child) => {
        if (child.type === "text") return child.value;
        if (child.type === "inlineCode") return child.value;
        return "";
      })
      .join("");

    const secondNode = tree.children[1];

    // If H1 is followed by a paragraph and merging is enabled, merge them: [Title] Body text
    if (mergeParagraph && secondNode?.type === "paragraph") {
      tree.children.splice(0, 2, {
        type: "paragraph",
        children: [
          { type: "text", value: `[${headingText}] ` },
          ...secondNode.children,
        ],
      });
    }
    // Otherwise, just convert H1 to paragraph: [Title]
    else {
      tree.children[0] = {
        type: "paragraph",
        children: [{ type: "text", value: `[${headingText}]` }],
      };
    }
  };
};

export const DEFAULT_BLUESKY_PLUGINS: RemarkPlugin[] = [
  remarkExpandLinks,
  remarkMonospaceCode,
];
