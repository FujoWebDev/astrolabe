import type { JSONContent } from "@tiptap/core";
import type { TreeTransformPlugin } from "@fujocoded/astdapters-mdast-starter";

/**
 * Splits a document tree at thread-break nodes into separate document trees.
 * Each thread becomes an independent document for separate posts/threads.
 *
 * This is a "pre" phase plugin that operates on JSONContent before mdast
 * conversion, allowing it to split the tree while preserving full ProseMirror
 * node context.
 */
export const threadBreakSplitter: TreeTransformPlugin = {
  pluginType: "tree-transform",
  phase: "pre",
  transform: (input: JSONContent, context) => {
    if (input.type !== "doc" || !input.content) {
      return input;
    }

    const threads: JSONContent[] = [];
    let currentThread: JSONContent = {
      type: "doc",
      content: [],
    };

    for (const node of input.content) {
      if (node.type !== "thread-break") {
        currentThread.content!.push(node);
        continue;
      }
      if (currentThread.content?.length) {
        threads.push(currentThread);
      }

      // Start new thread
      currentThread = {
        type: "doc",
        content: [],
      };
    }

    // Add final thread
    if (currentThread.content?.length) {
      threads.push(currentThread);
    }
    return threads.length > 0 ? threads : input;
  },
};

/**
 * Transforms thread-break nodes to thematic breaks in markdown.
 */
export const toMdastNode: import("@fujocoded/astdapters-mdast-starter").ConverterPlugin =
  {
    pluginType: "converter-node",
    handlesNode: (node: JSONContent): boolean => node.type === "thread-break",
    convert: (_node, _context) => ({
      type: "thematicBreak",
    }),
  };
