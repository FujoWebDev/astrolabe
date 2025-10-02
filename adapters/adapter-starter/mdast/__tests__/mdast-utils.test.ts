import { describe, expect, test } from "vitest";

import { compact } from "../src/mdast-utils.js";

import type { Root } from "mdast";

describe("compact", () => {
  test("merges adjacent html nodes produced by underline spans", () => {
    const sample: Root = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "This is a " },
            {
              type: "link",
              url: "https://fujocoded.com",
              title: null,
              children: [{ type: "text", value: "link" }],
            },
            { type: "text", value: " and this is a " },
            { type: "html", value: "<u>" },
            { type: "text", value: "unde" },
            { type: "html", value: "</u>" },
            { type: "html", value: "<u>" },
            {
              type: "strong",
              children: [{ type: "text", value: "rline" }],
            },
            { type: "html", value: "</u>" },
            { type: "html", value: "<u>" },
            { type: "text", value: "d" },
            { type: "html", value: "</u>" },
            { type: "text", value: " statement." },
          ],
        },
      ],
    };

    const tree: Root = structuredClone(sample);
    compact(tree);

    const expected: Root = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "This is a " },
            {
              type: "link",
              url: "https://fujocoded.com",
              title: null,
              children: [{ type: "text", value: "link" }],
            },
            { type: "text", value: " and this is a " },
            { type: "html", value: "<u>" },
            { type: "text", value: "unde" },
            {
              type: "strong",
              children: [{ type: "text", value: "rline" }],
            },
            { type: "text", value: "d" },
            { type: "html", value: "</u>" },
            { type: "text", value: " statement." },
          ],
        },
      ],
    };

    expect(tree).toStrictEqual(expected);
  });

});
