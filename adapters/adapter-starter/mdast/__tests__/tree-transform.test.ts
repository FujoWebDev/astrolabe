import { describe, expect, test } from "vitest";

import {
  convert,
  type TreeTransformPlugin,
  type ProseMirrorDocument,
} from "../src/index.js";
import type { Paragraph } from "mdast";

describe("convert with tree transforms", () => {
  test("duplicates input tree when pre-phase tree transform plugin returns two trees", async () => {
    const splitPlugin: TreeTransformPlugin = {
      pluginType: "tree-transform",
      phase: "pre",
      transform: (input) => {
        return [input, structuredClone(input)];
      },
    };

    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Hello, fujin!" }],
        },
      ],
    };

    const { trees } = await convert(input, { plugins: [splitPlugin] });

    expect(trees).toHaveLength(2);
    expect(trees[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello, fujin!" }],
        },
      ],
    });
    expect(trees[1]).toStrictEqual(trees[0]);
  });

  test("appends new paragraph when post-phase tree transform plugin modifies tree structure", async () => {
    const modifyPlugin: TreeTransformPlugin = {
      pluginType: "tree-transform",
      phase: "post",
      transform: (trees) => {
        return trees.map((tree) => {
          const modified = structuredClone(tree);
          // Add a new paragraph at the end
          modified.children.push({
            type: "paragraph",
            children: [{ type: "text", value: "You got plugin'd!" }],
          });
          return modified;
        });
      },
    };

    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Hello, fujin!" }],
        },
      ],
    };

    const { trees } = await convert(input, { plugins: [modifyPlugin] });

    expect(trees).toHaveLength(1);
    expect(trees[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello, fujin!" }],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "You got plugin'd!" }],
        },
      ],
    });
  });

  test("applies pre-phase and post-phase tree transform plugins in correct order", async () => {
    const firstPlugin: TreeTransformPlugin = {
      pluginType: "tree-transform",
      phase: "pre",
      transform: (input) => {
        // First plugin: duplicate the input
        return [input, structuredClone(input)];
      },
    };

    const secondPlugin: TreeTransformPlugin = {
      pluginType: "tree-transform",
      phase: "post",
      transform: (trees) => {
        return trees.map((tree, index) => {
          const modified = structuredClone(tree);
          // Add text to the first paragraph instead of creating a new one
          (modified.children[0] as Paragraph).children.push({
            type: "text",
            value: `You got plugin'd ${index}!`,
          });
          return modified;
        });
      },
    };
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Hello, fujin!" }],
        },
      ],
    };

    const { trees } = await convert(input, {
      plugins: [firstPlugin, secondPlugin],
    });

    expect(trees).toHaveLength(2);
    expect(trees[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "Hello, fujin!" },
            { type: "text", value: "You got plugin'd 0!" },
          ],
        },
      ],
    });
    expect(trees[1]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "Hello, fujin!" },
            { type: "text", value: "You got plugin'd 1!" },
          ],
        },
      ],
    });
  });

  test("converts document normally when empty plugin array is provided", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Nothing to see here" }],
        },
      ],
    };

    const { trees } = await convert(input, { plugins: [] });

    expect(trees).toHaveLength(1);
    expect(trees[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Nothing to see here" }],
        },
      ],
    });
  });

  test("preserves bold marks when duplicating tree with pre-phase tree transform plugin", async () => {
    const splitPlugin: TreeTransformPlugin = {
      pluginType: "tree-transform",
      phase: "pre",
      transform: (input) => {
        return [input, structuredClone(input)];
      },
    };

    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "A bold " },
            { type: "text", text: "fujin", marks: [{ type: "bold" }] },
            { type: "text", text: "!" },
          ],
        },
      ],
    };

    const { trees } = await convert(input, { plugins: [splitPlugin] });

    expect(trees).toHaveLength(2);
    expect(trees[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "A bold " },
            {
              type: "strong",
              children: [{ type: "text", value: "fujin" }],
            },
            { type: "text", value: "!" },
          ],
        },
      ],
    });
    expect(trees[1]).toStrictEqual(trees[0]);
  });
});
