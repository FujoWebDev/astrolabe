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
    expect(result.content[0].type).toBe("paragraph");
    
    const content = result.content[0].content;
    
    // Should have text segments split by facets
    expect(content.length).toBeGreaterThan(1);
    
    // Find the mention segment
    const mentionSegment = content.find(
      (node: any) =>
        node.marks?.some((mark: any) => mark.attrs?.href?.includes("did:plc:737bslnnf7vyaktosjlrshmd"))
    );
    expect(mentionSegment).toBeDefined();
    expect(mentionSegment?.text).toBe("@fujocoded.bsky.social");
    
    // Find link segments
    const linkSegments = content.filter(
      (node: any) =>
        node.marks?.some((mark: any) => mark.type === "link" && mark.attrs?.href?.startsWith("http"))
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
    expect(mentionNode.marks[0].attrs.href).toBe("#did:plc:example123");
  });
});
