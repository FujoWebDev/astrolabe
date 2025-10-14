import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, test } from "vitest";

import {
  convert,
  type LeafletConvertOptions,
  type ConverterPlugin,
  type ConverterMarkPlugin,
} from "../src/index.js";

import type {
  ProseMirrorDocument,
  ProseMirrorMark,
  ProseMirrorNode,
} from "@fujocoded/astdapters-mdast-starter";

const StarterKitSchema = getSchema([StarterKit]);

const validate = (doc: ProseMirrorDocument) => {
  try {
    StarterKitSchema.nodeFromJSON(doc);
  } catch (error) {
    throw new Error("Invalid ProseMirror document structure", {
      cause: error,
    });
  }

  return doc;
};

type ConvertOptions = LeafletConvertOptions & { validateDocument?: boolean };

const convertDocument = async (
  doc: ProseMirrorDocument,
  options?: ConvertOptions
) => {
  const shouldValidate = options?.validateDocument ?? true;
  const validated = shouldValidate ? validate(doc) : doc;

  const { validateDocument, ...rest } = options ?? {};

  return convert(validated, {
    ...rest,
  });
};

describe("leaflet adapter convert()", () => {
  test("converts a simple paragraph into text", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Hello, fujin." }],
        },
      ],
    };

    const { text, images } = await convertDocument(input);

    expect(text.text).toBe("Hello, fujin.");
    expect(images).toEqual([]);
  });

  test("converts bold text to facets", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "This is " },
            {
              type: "text",
              text: "bold",
              marks: [{ type: "bold" }],
            },
            { type: "text", text: " text" },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe("This is bold text");
    expect(text.facets).toHaveLength(1);
    expect(text.facets?.[0]).toBeDefined();
    expect(text.facets?.[0]).toMatchObject({
      index: {
        byteStart: 8,
        byteEnd: 12,
      },
      features: [
        {
          $type: "pub.leaflet.richtext.facet#bold",
        },
      ],
    });
  });

  test("converts italic text to facets", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "This is " },
            {
              type: "text",
              text: "italic",
              marks: [{ type: "italic" }],
            },
            { type: "text", text: " text" },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe("This is italic text");
    expect(text.facets).toHaveLength(1);
    expect(text.facets?.[0]).toMatchObject({
      index: {
        byteStart: 8,
        byteEnd: 14,
      },
      features: [
        {
          $type: "pub.leaflet.richtext.facet#italic",
        },
      ],
    });
  });

  test("converts links to facets", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "Check out " },
            {
              type: "text",
              text: "this link",
              marks: [
                {
                  type: "link",
                  attrs: { href: "https://example.com" },
                },
              ],
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe("Check out this link");
    expect(text.facets).toHaveLength(1);
    expect(text.facets?.[0]).toMatchObject({
      index: {
        byteStart: 10,
        byteEnd: 19,
      },
      features: [
        {
          $type: "pub.leaflet.richtext.facet#link",
          uri: "https://example.com",
        },
      ],
    });
  });

  test("handles nested marks (bold + italic)", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "This is " },
            {
              type: "text",
              text: "bold and italic",
              marks: [{ type: "bold" }, { type: "italic" }],
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe("This is bold and italic");
    expect(text.facets).toHaveLength(1);
    expect(text.facets?.[0].features).toHaveLength(2);
    expect(text.facets?.[0].features).toEqual(
      expect.arrayContaining([
        { $type: "pub.leaflet.richtext.facet#bold" },
        { $type: "pub.leaflet.richtext.facet#italic" },
      ])
    );
  });

  test("converts inline code to code facets", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "Use " },
            {
              type: "text",
              text: "console.log()",
              marks: [{ type: "code" }],
            },
            { type: "text", text: " for debugging" },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe("Use console.log() for debugging");
    expect(text.facets).toHaveLength(1);
    expect(text.facets?.[0]).toMatchObject({
      features: [
        {
          $type: "pub.leaflet.richtext.facet#code",
        },
      ],
    });
  });

  test("formats unordered lists with facets preserved", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "bulletList",
          attrs: {},
          content: [
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [{ type: "text", text: "The littlest meow meow" }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [
                    { type: "text", text: "Incredibly problematic villain" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [
                    { type: "text", text: 'Puts the "old man" in ' },
                    {
                      type: "text",
                      text: "old man yaoi",
                      marks: [{ type: "italic" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe(
      '- The littlest meow meow\n- Incredibly problematic villain\n- Puts the "old man" in old man yaoi'
    );

    // Check that italic facet is preserved in list
    const italicFacet = text.facets?.find((f) =>
      f.features.some(
        (feat) => feat.$type === "pub.leaflet.richtext.facet#italic"
      )
    );
    expect(italicFacet).toBeDefined();
  });

  test("drops unsupported html nodes (underline) by default", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            {
              type: "text",
              text: "underlined",
              marks: [{ type: "underline" }],
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe("underlined");

    // Underline should be converted to facet
    const underlineFacet = text.facets?.find((f) =>
      f.features.some(
        (feat) => feat.$type === "pub.leaflet.richtext.facet#underline"
      )
    );
    expect(underlineFacet).toBeDefined();
  });

  test("supports custom block node via plugin", async () => {
    const customDividerPlugin: ConverterPlugin = {
      pluginType: "converter-node",
      handlesNode: (node: ProseMirrorNode) => node.type === "customDivider",
      convert: () => ({
        type: "paragraph",
        children: [{ type: "text", value: "~~~" }],
      }),
    };

    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "customDivider",
          attrs: {},
        },
      ],
    };

    const { text } = await convertDocument(input, {
      jsonDocPlugins: [customDividerPlugin],
      validateDocument: false,
    });

    expect(text.text).toBe("~~~");
  });

  test("supports custom mark via plugin", async () => {
    const spoilerPlugin: ConverterMarkPlugin = {
      pluginType: "converter-mark",
      handlesMark: (mark: ProseMirrorMark) => mark.type === "spoiler",
      convert: (_mark, node) => ({
        type: "text",
        value: `||${node.text}||`,
      }),
    };

    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            {
              type: "text",
              text: "secret",
              marks: [{ type: "spoiler" }],
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input, {
      jsonDocPlugins: [spoilerPlugin],
      validateDocument: false,
    });

    expect(text.text).toBe("||secret||");
  });

  test("converts complex document with headings and lists", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "My 5 Blorbos!" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [
            { type: "text", text: "This list " },
            { type: "text", text: "is", marks: [{ type: "bold" }] },
            { type: "text", text: " subject to change" },
          ],
        },
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Top 3 (can't decide order):" }],
        },
        {
          type: "bulletList",
          attrs: {},
          content: [
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [{ type: "text", text: "The littlest meow meow" }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [
                    { type: "text", text: "Incredibly problematic villain" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [
                    { type: "text", text: 'Puts the "old man" in ' },
                    {
                      type: "text",
                      text: "old man yaoi",
                      marks: [{ type: "italic" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Others:" }],
        },
        {
          type: "orderedList",
          attrs: { start: 4 },
          content: [
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [
                    { type: "text", text: "Character who deserved better" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  attrs: {},
                  content: [
                    { type: "text", text: "Character who " },
                    {
                      type: "text",
                      text: "definitely",
                      marks: [{ type: "underline" }],
                    },
                    { type: "text", text: " deserved better" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe(
      'My 5 Blorbos!\n\nThis list is subject to change\n\nTop 3 (can\'t decide order):\n\n- The littlest meow meow\n- Incredibly problematic villain\n- Puts the "old man" in old man yaoi\n\nOthers:\n\n- Character who deserved better\n- Character who definitely deserved better'
    );
  });

  test("converts complex document with blockquotes and breaks", async () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "A favorite quote:" }],
        },
        {
          type: "blockquote",
          attrs: {},
          content: [
            {
              type: "paragraph",
              attrs: {},
              content: [
                {
                  type: "text",
                  text: "I see now that the circumstances of one's birth are irrelevant.",
                },
              ],
            },
            {
              type: "paragraph",
              attrs: {},
              content: [
                {
                  type: "text",
                  text: "It is what you do with the gift of life",
                },
                { type: "hardBreak" },
                { type: "text", text: "that determines who you are." },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "— Mewtwo" },
            { type: "hardBreak" },
            { type: "text", text: "Pokemon, The First Movie" },
          ],
        },
        {
          type: "horizontalRule",
          attrs: {},
        },
        {
          type: "paragraph",
          attrs: {},
          content: [
            {
              type: "text",
              text: "Follow for more inspiring anime quotes 💖🌟",
            },
          ],
        },
      ],
    };

    const { text } = await convertDocument(input);

    expect(text.text).toBe(
      "A favorite quote:\n\nI see now that the circumstances of one's birth are irrelevant.\n\nIt is what you do with the gift of life\nthat determines who you are.\n\n— Mewtwo\nPokemon, The First Movie\n\n---\n\nFollow for more inspiring anime quotes 💖🌟"
    );
  });
});
