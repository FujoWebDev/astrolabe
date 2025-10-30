import { describe, expect, test } from "vitest";

import {
  convertWithPlugins,
  type TreeTransformPlugin,
  type ProseMirrorDocument,
} from "../src/index.js";
import type { Paragraph, Root } from "mdast";
import { convert } from "../src/index.js";

describe("convertWithPlugins", () => {
  test("duplicates input tree when pre-phase tree transform plugin returns two trees", () => {
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

    const result = convertWithPlugins(
      input,
      (doc, context) => convert(doc, context) as Root,
      [splitPlugin]
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello, fujin!" }],
        },
      ],
    });
    expect(result[1]).toStrictEqual(result[0]);
  });

  test("appends new paragraph when post-phase tree transform plugin modifies tree structure", () => {
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

    const result = convertWithPlugins(
      input,
      (doc, context) => convert(doc, context) as Root,
      [modifyPlugin]
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
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

  test("applies pre-phase and post-phase tree transform plugins in correct order", () => {
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

    const result = convertWithPlugins(
      input,
      (doc, context) => convert(doc, context) as Root,
      [firstPlugin, secondPlugin]
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
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
    expect(result[1]).toStrictEqual({
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

  test("converts document normally when empty plugin array is provided", () => {
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

    const result = convertWithPlugins(
      input,
      (doc, context) => convert(doc, context) as Root,
      []
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Nothing to see here" }],
        },
      ],
    });
  });

  test("preserves bold marks when duplicating tree with pre-phase tree transform plugin", () => {
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

    const result = convertWithPlugins(
      input,
      (doc, context) => convert(doc, context) as Root,
      [splitPlugin]
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
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
    expect(result[1]).toStrictEqual(result[0]);
  });
});
