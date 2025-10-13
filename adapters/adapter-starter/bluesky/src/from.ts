export interface FromBlueskyOptions {
  resolveMentionUrl?: (did: string) => string;
}

interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<{
    $type: string;
    did?: string;
    uri?: string;
  }>;
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

  const facets =
    "facets" in recordValue
      ? (recordValue.facets as Facet[] | undefined)
      : undefined;

  return {
    type: "doc",
    attrs: {},
    content: [
      {
        type: "paragraph",
        content: serializeFacets(recordValue.text, facets, options),
      },
    ],
  };
};

/**
 * Converts Bluesky facets to ProseMirror text nodes with marks. Facets use byte
 * offsets to mark sections of text with features like mentions and links.
 */
const serializeFacets = (
  originalText: string,
  facets: Facet[] = [],
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
          marks.push({
            type: "link",
            attrs: {
              href:
                options.resolveMentionUrl?.(feature.did!) ?? `#${feature.did}`,
            },
          });
          break;
        }
        case "app.bsky.richtext.facet#link": {
          marks.push({
            type: "link",
            attrs: {
              href: feature.uri,
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
