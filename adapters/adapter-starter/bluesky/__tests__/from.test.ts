import { describe, expect, test } from "vitest";
import { fromBlueskyPost } from "../src/from.js";
import exampleRecord from "../stories/records/did:plc:r2vpg2iszskbkegoldmqa322:app.bsky.feed.post:3m2svesohjs2c.json";

describe("fromBlueskyPost()", () => {
  test("converts plain text without facets", () => {
    const record = {
      text: "Hello, world!",
      $type: "app.bsky.feed.post",
    };

    const result = fromBlueskyPost(record);

    expect(result).toEqual({
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Hello, world!",
            },
          ],
        },
      ],
    });
  });

  test("converts text with link facet", () => {
    const record = {
      text: "Check out https://fujocoded.com for more info",
      $type: "app.bsky.feed.post",
      facets: [
        {
          index: {
            byteStart: 10,
            byteEnd: 31,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: "https://fujocoded.com",
            },
          ],
        },
      ],
    };

    const result = fromBlueskyPost(record);

    expect(result).toEqual({
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Check out ",
            },
            {
              type: "text",
              text: "https://fujocoded.com",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://fujocoded.com",
                  },
                },
              ],
            },
            {
              type: "text",
              text: " for more info",
            },
          ],
        },
      ],
    });
  });

  test("converts text with mention facet", () => {
    const record = {
      text: "Thanks @fujocoded.bsky.social for the help!",
      $type: "app.bsky.feed.post",
      facets: [
        {
          index: {
            byteStart: 7,
            byteEnd: 29,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#mention",
              did: "did:plc:example123",
            },
          ],
        },
      ],
    };

    const result = fromBlueskyPost(record, {
      resolveMentionUrl: (did) => `https://bsky.app/profile/${did}`,
    });

    expect(result).toEqual({
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Thanks ",
            },
            {
              type: "text",
              text: "@fujocoded.bsky.social",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://bsky.app/profile/did:plc:example123",
                  },
                },
              ],
            },
            {
              type: "text",
              text: " for the help!",
            },
          ],
        },
      ],
    });
  });

  test("converts text with multiple facets", () => {
    const record = {
      text: "Visit https://example.com and follow @user.bsky.social!",
      $type: "app.bsky.feed.post",
      facets: [
        {
          index: {
            byteStart: 6,
            byteEnd: 25,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: "https://example.com",
            },
          ],
        },
        {
          index: {
            byteStart: 37,
            byteEnd: 56,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#mention",
              did: "did:plc:user123",
            },
          ],
        },
      ],
    };

    const result = fromBlueskyPost(record, {
      resolveMentionUrl: (did) => `https://bsky.app/profile/${did}`,
    });

    expect(result).toEqual({
      type: "doc",
      attrs: {},
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Visit ",
            },
            {
              type: "text",
              text: "https://example.com",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://example.com",
                  },
                },
              ],
            },
            {
              type: "text",
              text: " and follow ",
            },
            {
              type: "text",
              text: "@user.bsky.social!",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://bsky.app/profile/did:plc:user123",
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("handles emoji and multi-byte characters correctly", () => {
    const record = {
      text: "Hello 👋 check https://example.com",
      $type: "app.bsky.feed.post",
      facets: [
        {
          index: {
            byteStart: 17,
            byteEnd: 36,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: "https://example.com",
            },
          ],
        },
      ],
    };

    const result = fromBlueskyPost(record);

    expect(result.content[0].content).toEqual([
      {
        type: "text",
        text: "Hello 👋 check ",
      },
      {
        type: "text",
        text: "https://example.com",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://example.com",
            },
          },
        ],
      },
    ]);
  });

  test("converts real example record with multiple facets", () => {
    const result = fromBlueskyPost(exampleRecord.value, {
      resolveMentionUrl: (did) => `https://bsky.app/profile/${did}`,
    });

    expect(result.type).toBe("doc");
    
    // Should have multiple paragraphs (text contains \n\n)
    expect(result.content.length).toBeGreaterThan(1);
    expect(result.content[0].type).toBe("paragraph");

    // Get all nodes from all paragraphs
    const allNodes = result.content.flatMap((p: any) => p.content);

    // Find the mention segment
    const mentionSegment = allNodes.find((node: any) =>
      node.marks?.some((mark: any) =>
        mark.attrs?.href?.includes("did:plc:737bslnnf7vyaktosjlrshmd")
      )
    );
    expect(mentionSegment).toBeDefined();
    expect(mentionSegment?.text).toBe("@fujocoded.bsky.social");

    // Find link segments
    const linkSegments = allNodes.filter((node: any) =>
      node.marks?.some(
        (mark: any) =>
          mark.type === "link" && mark.attrs?.href?.startsWith("http")
      )
    );
    expect(linkSegments.length).toBeGreaterThanOrEqual(2);
  });

  test("handles record wrapped in value property", () => {
    const record = {
      uri: "at://example",
      value: {
        text: "Hello, world!",
        $type: "app.bsky.feed.post",
      },
    };

    const result = fromBlueskyPost(record);

    expect(result.content[0].content[0].text).toBe("Hello, world!");
  });

  test("handles missing facets gracefully", () => {
    const record = {
      text: "Just plain text",
      $type: "app.bsky.feed.post",
    };

    const result = fromBlueskyPost(record);

    expect(result.content[0].content).toEqual([
      {
        type: "text",
        text: "Just plain text",
      },
    ]);
  });

  test("handles empty facets array", () => {
    const record = {
      text: "Just plain text",
      $type: "app.bsky.feed.post",
      facets: [],
    };

    const result = fromBlueskyPost(record);

    expect(result.content[0].content).toEqual([
      {
        type: "text",
        text: "Just plain text",
      },
    ]);
  });

  test("uses default mention URL when resolveMentionUrl not provided", () => {
    const record = {
      text: "Thanks @user.bsky.social!",
      $type: "app.bsky.feed.post",
      facets: [
        {
          index: {
            byteStart: 7,
            byteEnd: 25,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#mention",
              did: "did:plc:example123",
            },
          ],
        },
      ],
    };

    const result = fromBlueskyPost(record);

    const mentionNode = result.content[0].content[1];
    expect(mentionNode.marks?.[0]?.attrs?.href).toBe("#did:plc:example123");
  });

  test("handles single newlines as hard breaks", () => {
    const record = {
      text: "Line one\nLine two\nLine three",
      $type: "app.bsky.feed.post",
    };

    const result = fromBlueskyPost(record);

    // Should have single paragraph
    expect(result.content.length).toBe(1);
    expect(result.content[0].type).toBe("paragraph");

    const nodes = result.content[0].content;
    // Should have: text, hardBreak, text, hardBreak, text
    expect(nodes.length).toBe(5);
    expect(nodes[0].type).toBe("text");
    expect(nodes[0].text).toBe("Line one");
    expect(nodes[1].type).toBe("hardBreak");
    expect(nodes[2].type).toBe("text");
    expect(nodes[2].text).toBe("Line two");
    expect(nodes[3].type).toBe("hardBreak");
    expect(nodes[4].type).toBe("text");
    expect(nodes[4].text).toBe("Line three");
  });

  test("handles double newlines as paragraph breaks", () => {
    const record = {
      text: "Paragraph one\n\nParagraph two\n\nParagraph three",
      $type: "app.bsky.feed.post",
    };

    const result = fromBlueskyPost(record);

    // Should have three paragraphs
    expect(result.content.length).toBe(3);
    expect(result.content[0].type).toBe("paragraph");
    expect(result.content[1].type).toBe("paragraph");
    expect(result.content[2].type).toBe("paragraph");

    expect(result.content[0].content[0].text).toBe("Paragraph one");
    expect(result.content[1].content[0].text).toBe("Paragraph two");
    expect(result.content[2].content[0].text).toBe("Paragraph three");
  });

  test("handles mixed single and double newlines", () => {
    const record = {
      text: "Line one\nLine two\n\nParagraph two line one\nParagraph two line two",
      $type: "app.bsky.feed.post",
    };

    const result = fromBlueskyPost(record);

    // Should have two paragraphs
    expect(result.content.length).toBe(2);

    // First paragraph should have hard break
    const para1 = result.content[0].content;
    expect(para1.length).toBe(3); // text, hardBreak, text
    expect(para1[0].text).toBe("Line one");
    expect(para1[1].type).toBe("hardBreak");
    expect(para1[2].text).toBe("Line two");

    // Second paragraph should have hard break
    const para2 = result.content[1].content;
    expect(para2.length).toBe(3); // text, hardBreak, text
    expect(para2[0].text).toBe("Paragraph two line one");
    expect(para2[1].type).toBe("hardBreak");
    expect(para2[2].text).toBe("Paragraph two line two");
  });

  test("handles newlines with facets", () => {
    const record = {
      text: "Check out https://example.com for more\n\nAlso visit https://example.org",
      $type: "app.bsky.feed.post",
      facets: [
        {
          index: {
            byteStart: 10,
            byteEnd: 29,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: "https://example.com",
            },
          ],
        },
        {
          index: {
            byteStart: 51,
            byteEnd: 70,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: "https://example.org",
            },
          ],
        },
      ],
    };

    const result = fromBlueskyPost(record);

    // Should have two paragraphs
    expect(result.content.length).toBe(2);

    // First paragraph should have the first link
    const para1Nodes = result.content[0].content;
    const link1 = para1Nodes.find(
      (n: any) => n.text === "https://example.com"
    );
    expect(link1).toBeDefined();
    expect(link1?.marks?.[0]?.attrs?.href).toBe("https://example.com");

    // Second paragraph should have the second link
    const para2Nodes = result.content[1].content;
    const link2 = para2Nodes.find(
      (n: any) => n.text === "https://example.org"
    );
    expect(link2).toBeDefined();
    expect(link2?.marks?.[0]?.attrs?.href).toBe("https://example.org");
  });
});
