import { RichText } from "@atproto/api";
import type { FacetLink, FacetMention, Facet } from "@atproto/api";

export interface FromBlueskyOptions {
  resolveMentionUrl?: (did: string) => string;
}

interface TextNode {
  type: "text";
  text: string;
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
}

/**
 * Converts a Bluesky post record to a ProseMirror document structure. Handles
 * AT Protocol post records and converts them to a compatible JSON document
 * format.
 */
export const fromBlueskyPost = (
  record: Record<string, unknown>,
  options: FromBlueskyOptions = {}
) => {
  const recordValue = ("value" in record ? record["value"] : record) as Record<
    string,
    unknown
  >;

  if (typeof recordValue !== "object" || recordValue === null) {
    throw new Error("Invalid record: expected an object");
  }

  if (!("text" in recordValue) || typeof recordValue.text !== "string") {
    throw new Error("Invalid record: missing or invalid text field");
  }

  return {
    type: "doc",
    attrs: {},
    content: textToParagraphs(
      recordValue.text,
      recordValue.facets as RichText["facets"],
      options
    ),
  };
};

/**
 * Converts Bluesky text and facets into ProseMirror paragraph nodes.
 * Handles double newlines as paragraph breaks and single newlines as hard breaks.
 */
const textToParagraphs = (
  text: string,
  facets: RichText["facets"] = [],
  options: FromBlueskyOptions = {}
) => {
  const paragraphs: Array<{
    type: string;
    content: (TextNode | { type: "hardBreak" })[];
  }> = [];
  let currentParagraph: (TextNode | { type: "hardBreak" })[] = [];

  // Process each segment from RichText
  for (const segment of serializeFacets(text, facets, options)) {
    const segmentText = segment.text;

    // Build marks for this segment
    const marks: TextNode["marks"] = [];

    if (segment.marks?.some((mark) => mark.type === "link")) {
      marks.push({
        type: "link",
        attrs: {
          href:
            segment.marks?.find((mark) => mark.type === "link")?.attrs?.href ??
            "",
        },
      });
    } else if (segment.marks?.some((mark) => mark.type === "mention")) {
      marks.push({
        type: "link",
        attrs: {
          href:
            options.resolveMentionUrl?.(
              segment.marks?.find((mark) => mark.type === "mention")?.attrs
                ?.href as string
            ) ??
            `#${
              segment.marks?.find((mark) => mark.type === "mention")?.attrs
                ?.href
            }`,
        },
      });
    }

    // Split segment text on newlines
    const parts = segmentText.split(/(\n+)/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part.length === 0) continue;

      // Check if this part is newlines
      if (/^\n+$/.test(part)) {
        // Double or more newlines = paragraph break
        if (part.length >= 2) {
          // End current paragraph
          if (currentParagraph.length > 0) {
            paragraphs.push({
              type: "paragraph",
              content: currentParagraph,
            });
            currentParagraph = [];
          }
        } else {
          // Single newline = hard break
          currentParagraph.push({ type: "hardBreak" });
        }
      } else {
        // Regular text
        currentParagraph.push({
          type: "text",
          text: part,
          ...(marks.length > 0 ? { marks } : {}),
        });
      }
    }
  }

  // Add the last paragraph if it has content
  if (currentParagraph.length > 0) {
    paragraphs.push({
      type: "paragraph",
      content: currentParagraph,
    });
  }

  // Return at least one empty paragraph if no content
  if (paragraphs.length === 0) {
    return [{ type: "paragraph", content: [] }];
  }

  return paragraphs;
};

/**
 * Converts Bluesky facets to ProseMirror text nodes with marks. Facets use byte
 * offsets to mark sections of text with features like mentions and links.
 */
const serializeFacets = (
  originalText: string,
  facets: RichText["facets"] = [],
  options: FromBlueskyOptions = {}
): TextNode[] => {
  if (!facets || facets.length === 0) {
    return [{ type: "text", text: originalText }];
  }

  const textEncoder = new TextEncoder();
  const textBytes = textEncoder.encode(originalText);
  const textDecoder = new TextDecoder();

  const segments: Array<{
    byteStart: number;
    byteEnd: number;
    marks?: TextNode["marks"];
  }> = [];

  const sortedFacets = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart
  );

  let currentByte = 0;

  for (const facet of sortedFacets) {
    const { byteStart, byteEnd } = facet.index;

    if (currentByte < byteStart) {
      segments.push({
        byteStart: currentByte,
        byteEnd: byteStart,
      });
    }

    const marks: TextNode["marks"] = [];
    for (const feature of facet.features) {
      switch (feature.$type) {
        case "app.bsky.richtext.facet#mention": {
          const mention = feature as FacetMention;
          marks.push({
            type: "link",
            attrs: {
              href:
                options.resolveMentionUrl?.(mention.did!) ?? `#${mention.did}`,
            },
          });
          break;
        }
        case "app.bsky.richtext.facet#link": {
          const link = feature as FacetLink;
          marks.push({
            type: "link",
            attrs: {
              href: link.uri,
            },
          });
          break;
        }
        default: {
          console.warn(`Unknown facet type: ${feature.$type}`);
        }
      }
    }

    segments.push({
      byteStart,
      byteEnd,
      marks: marks.length > 0 ? marks : undefined,
    });

    currentByte = byteEnd;
  }

  if (currentByte < textBytes.length) {
    segments.push({
      byteStart: currentByte,
      byteEnd: textBytes.length,
    });
  }

  return segments.map((segment) => {
    const text = textDecoder.decode(
      textBytes.slice(segment.byteStart, segment.byteEnd)
    );
    return {
      type: "text",
      text,
      ...(segment.marks ? { marks: segment.marks } : {}),
    };
  });
};
