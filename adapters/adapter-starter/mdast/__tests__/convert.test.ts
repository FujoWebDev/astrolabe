import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, test } from "vitest";

import {
  convert,
  type ConverterPlugin,
  type ConverterMarkPlugin,
  type ProseMirrorDocument,
  type ProseMirrorMark,
  type ProseMirrorNode,
} from "../src/index.js";

const codeBlock = (code: string, language?: string) => ({
  type: "codeBlock",
  attrs: language ? { language } : {},
  content: [{ type: "text", text: code }],
});

const image = (
  src: string,
  alt?: string | null,
  title?: string | null
): ProseMirrorNode =>
  ({
    type: "image",
    attrs: { src, alt: alt ?? null, title: title ?? null },
  } as ProseMirrorNode);

const StarterKitSchema = getSchema([StarterKit]);
const validateAndConvert = (doc: ProseMirrorDocument) => {
  try {
    StarterKitSchema.nodeFromJSON(doc);
  } catch (error) {
    throw new Error("Invalid ProseMirror document structure", {
      cause: error,
    });
  }
  return convert(doc, emptyPlugins);
};

const emptyPlugins: { plugins: ConverterPlugin[] } = {
  plugins: [],
};

describe("mdast adapter convert()", () => {
  test("converts a simple paragraph with plain text", () => {
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
    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello, fujin." }],
        },
      ],
    });
  });

  test("applies bold and italic marks, and compacts adjacent strong nodes", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "strong and ", marks: [{ type: "bold" }] },
            {
              type: "text",
              text: "italic",
              marks: [{ type: "bold" }, { type: "italic" }],
            },
            { type: "text", text: " statement, don't " },
            { type: "text", text: "you", marks: [{ type: "italic" }] },
            { type: "text", text: " think?" },
          ],
        },
      ],
    };
    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              // adjacent strong nodes should be merged by compact()
              type: "strong",
              children: [
                { type: "text", value: "strong and " },
                {
                  type: "emphasis",
                  children: [{ type: "text", value: "italic" }],
                },
              ],
            },
            { type: "text", value: " statement, don't " },
            {
              type: "emphasis",
              children: [{ type: "text", value: "you" }],
            },
            { type: "text", value: " think?" },
          ],
        },
      ],
    });
  });

  test("renders inline code mark as inlineCode node", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "sum(a,b)", marks: [{ type: "code" }] },
          ],
        },
      ],
    };
    const ast = validateAndConvert(input);
    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "inlineCode", value: "sum(a,b)" }],
        },
      ],
    });
  });

  test("renders link mark with href and title", () => {
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
              text: "link",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://fujocoded.com",
                    title: "FujoCoded LLC",
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const ast = validateAndConvert(input);
    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "link",
              url: "https://fujocoded.com",
              title: "FujoCoded LLC",
              children: [{ type: "text", value: "link" }],
            },
          ],
        },
      ],
    });
  });

  test("renders underline mark as html node", () => {
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
    const ast = validateAndConvert(input);
    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "html", value: "<u>" },
            { type: "text", value: "underlined" },
            { type: "html", value: "</u>" },
          ],
        },
      ],
    });
  });

  test("compacts adjacent underline html nodes across mixed content", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "This is a " },
            {
              type: "text",
              text: "link",
              marks: [
                {
                  type: "link",
                  attrs: { href: "https://fujocoded.com", title: null },
                },
              ],
            },
            { type: "text", text: " and this is a " },
            { type: "text", text: "unde", marks: [{ type: "underline" }] },
            {
              type: "text",
              text: "rline",
              marks: [{ type: "bold" }, { type: "underline" }],
            },
            { type: "text", text: "d", marks: [{ type: "underline" }] },
            { type: "text", text: " statement." },
          ],
        },
      ],
    };

    const ast = validateAndConvert(input);
    expect(ast).toStrictEqual({
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
    });
  });

  test("converts codeBlock nodes with language and content", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [codeBlock("console.log('hi')", "js") as any],
    };

    const ast = convert(input, emptyPlugins);

    expect(ast).toStrictEqual({
      type: "root",
      children: [{ type: "code", lang: "js", value: "console.log('hi')" }],
    });
  });

  test("converts image nodes with src, title, alt", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        image(
          "/img/boba-tan.png",
          "a raccoon... or maybe not?",
          "She spies!"
        ) as any,
      ],
    };

    const ast = convert(input, emptyPlugins);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "image",
          url: "/img/boba-tan.png",
          title: "She spies!",
          alt: "a raccoon... or maybe not?",
        },
      ],
    });
  });

  test("trims leading/trailing spaces in paragraphs adjacent to block elements", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        // trailing space should be trimmed because next sibling is a block element
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Hello " }],
        },
        codeBlock("42", "txt"),
        // leading space should be trimmed because previous sibling is a block element
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: " fujin" }],
        },
      ],
    };

    const ast = convert(input, emptyPlugins);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello" }],
        },
        { type: "code", lang: "txt", value: "42" },
        {
          type: "paragraph",
          children: [{ type: "text", value: "fujin" }],
        },
      ],
    });
  });

  test("uses a plugin to handle a custom block node", () => {
    const plugin: ConverterPlugin = {
      pluginType: "converter-node",
      handlesNode: (node: ProseMirrorNode): boolean =>
        node.type === "horizontalRule",
      convert: () => ({ type: "thematicBreak" }),
    };

    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "horizontalRule",
          attrs: {},
        },
      ],
    };
    const ast = convert(input, { plugins: [plugin] });

    expect(ast).toStrictEqual({
      type: "root",
      children: [{ type: "thematicBreak" }],
    });
  });

  test("uses a plugin to handle a custom mark", () => {
    const plugin: ConverterMarkPlugin = {
      pluginType: "converter-mark",
      handlesMark: (mark: ProseMirrorMark): boolean => mark.type === "spoiler",
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
            { type: "text", text: "secret", marks: [{ type: "spoiler" }] },
          ],
        },
      ],
    };

    const ast = convert(input, { plugins: [plugin] });
    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "||secret||" }],
        },
      ],
    });
  });

  test("converts heading nodes with depth and content", () => {
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
      ],
    };

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "My 5 Blorbos!" }],
        },
        {
          type: "heading",
          depth: 2,
          children: [
            { type: "text", value: "This list " },
            {
              type: "strong",
              children: [{ type: "text", value: "is" }],
            },
            { type: "text", value: " subject to change" },
          ],
        },
      ],
    });
  });

  test("converts bulletList nodes with list items", () => {
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

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "list",
          ordered: false,
          spread: false,
          children: [
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", value: "The littlest meow meow" }],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: "Incredibly problematic villain" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: 'Puts the "old man" in ' },
                    {
                      type: "emphasis",
                      children: [{ type: "text", value: "old man yaoi" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("converts orderedList nodes with start attribute", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
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

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "list",
          ordered: true,
          spread: false,
          start: 4,
          children: [
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: "Character who deserved better" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: "Character who " },
                    { type: "html", value: "<u>" },
                    { type: "text", value: "definitely" },
                    { type: "html", value: "</u>" },
                    { type: "text", value: " deserved better" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("converts blockquote nodes", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
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
      ],
    };

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "blockquote",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value:
                    "I see now that the circumstances of one's birth are irrelevant.",
                },
              ],
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value: "It is what you do with the gift of life",
                },
                { type: "break" },
                { type: "text", value: "that determines who you are." },
              ],
            },
          ],
        },
      ],
    });
  });

  test("converts hardBreak nodes", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [
            { type: "text", text: "— Mewtwo" },
            { type: "hardBreak" },
            { type: "text", text: "Pokemon, The First Movie" },
          ],
        },
      ],
    };

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "— Mewtwo" },
            { type: "break" },
            { type: "text", value: "Pokemon, The First Movie" },
          ],
        },
      ],
    });
  });

  test("converts horizontalRule nodes", () => {
    const input: ProseMirrorDocument = {
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "Before" }],
        },
        {
          type: "horizontalRule",
          attrs: {},
        },
        {
          type: "paragraph",
          attrs: {},
          content: [{ type: "text", text: "After" }],
        },
      ],
    };

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Before" }],
        },
        { type: "thematicBreak" },
        {
          type: "paragraph",
          children: [{ type: "text", value: "After" }],
        },
      ],
    });
  });

  test("converts complex document with headings and lists", () => {
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

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "My 5 Blorbos!" }],
        },
        {
          type: "heading",
          depth: 2,
          children: [
            { type: "text", value: "This list " },
            {
              type: "strong",
              children: [{ type: "text", value: "is" }],
            },
            { type: "text", value: " subject to change" },
          ],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "Top 3 (can't decide order):" }],
        },
        {
          type: "list",
          ordered: false,
          spread: false,
          children: [
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", value: "The littlest meow meow" }],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: "Incredibly problematic villain" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: 'Puts the "old man" in ' },
                    {
                      type: "emphasis",
                      children: [{ type: "text", value: "old man yaoi" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "Others:" }],
        },
        {
          type: "list",
          ordered: true,
          spread: false,
          start: 4,
          children: [
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: "Character who deserved better" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    { type: "text", value: "Character who " },
                    { type: "html", value: "<u>" },
                    { type: "text", value: "definitely" },
                    { type: "html", value: "</u>" },
                    { type: "text", value: " deserved better" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("converts complex document with blockquotes and breaks", () => {
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
            { type: "text", text: "Follow for more inspiring anime quotes 💖🌟" },
          ],
        },
      ],
    };

    const ast = validateAndConvert(input);

    expect(ast).toStrictEqual({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "A favorite quote:" }],
        },
        {
          type: "blockquote",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value:
                    "I see now that the circumstances of one's birth are irrelevant.",
                },
              ],
            },
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value: "It is what you do with the gift of life",
                },
                { type: "break" },
                { type: "text", value: "that determines who you are." },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          children: [
            { type: "text", value: "— Mewtwo" },
            { type: "break" },
            { type: "text", value: "Pokemon, The First Movie" },
          ],
        },
        { type: "thematicBreak" },
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              value: "Follow for more inspiring anime quotes 💖🌟",
            },
          ],
        },
      ],
    });
  });
});
