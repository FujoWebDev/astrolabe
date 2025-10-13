export interface FromLeafletOptions {
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

interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TextNode {
  type: "text";
  text: string;
  marks?: Mark[];
}

interface LeafletBlock {
  $type: string;
  block: Record<string, unknown>;
}

interface LeafletTextBlock {
  $type: "pub.leaflet.blocks.text";
  plaintext: string;
  facets?: Facet[];
}

interface LeafletHeaderBlock {
  $type: "pub.leaflet.blocks.header";
  level: number;
  plaintext: string;
  facets?: Facet[];
}

interface LeafletListItem {
  $type: "pub.leaflet.blocks.unorderedList#listItem";
  content: LeafletTextBlock;
  children: LeafletListItem[];
}

interface LeafletUnorderedListBlock {
  $type: "pub.leaflet.blocks.unorderedList";
  children: LeafletListItem[];
}

/**
 * Converts a Leaflet post record to a ProseMirror document structure. Handles
 * AT Protocol post records and converts them to a compatible JSON document
 * format.
 *
 * This effectively converts a pub.leaflet.pages.linearDocument to a
 * ProseMirror Doc.
 */
export const fromLeafletPost = (
  record: Record<string, unknown>,
  options: FromLeafletOptions = {}
) => {
  const recordValue = ("value" in record ? record["value"] : record) as Record<
    string,
    unknown
  >;

  if (typeof recordValue !== "object" || recordValue === null) {
    throw new Error("Invalid record: expected an object");
  }

  // Check if this is a linearDocument page with blocks
  if ("blocks" in recordValue && Array.isArray(recordValue.blocks)) {
    const blocks = recordValue.blocks as LeafletBlock[];
    return {
      type: "doc",
      attrs: {},
      content: blocks
        .map((block) => convertBlock(block, options))
        .filter((node) => node !== null),
    };
  }

  if (!("text" in recordValue) || typeof recordValue.text !== "string") {
    throw new Error("Invalid record: missing blocks or text field");
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
 * Converts a single Leaflet block to a ProseMirror node
 */
const convertBlock = (
  block: LeafletBlock,
  options: FromLeafletOptions
): Record<string, unknown> | null => {
  const blockContent = block.block;
  const blockType = blockContent.$type as string;

  switch (blockType) {
    case "pub.leaflet.blocks.text": {
      const textBlock = blockContent as unknown as LeafletTextBlock;
      if (!textBlock.plaintext || textBlock.plaintext.trim() === "") {
        return null;
      }
      return {
        type: "paragraph",
        content: serializeFacets(
          textBlock.plaintext,
          textBlock.facets,
          options
        ),
      };
    }

    case "pub.leaflet.blocks.header": {
      const headerBlock = blockContent as unknown as LeafletHeaderBlock;
      return {
        type: "heading",
        attrs: { level: headerBlock.level },
        content: serializeFacets(
          headerBlock.plaintext,
          headerBlock.facets,
          options
        ),
      };
    }

    case "pub.leaflet.blocks.unorderedList": {
      const listBlock = blockContent as unknown as LeafletUnorderedListBlock;
      return {
        type: "bulletList",
        content: listBlock.children.map((item) =>
          convertListItem(item, options)
        ),
      };
    }

    case "pub.leaflet.blocks.website": {
      // For now, create a paragraph with a link to the website
      const websiteBlock = blockContent as {
        src: string;
        title?: string;
        description?: string;
      };
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: websiteBlock.title || websiteBlock.src,
            marks: [
              {
                type: "link",
                attrs: { href: websiteBlock.src },
              },
            ],
          },
        ],
      };
    }

    case "pub.leaflet.blocks.iframe": {
      // For now, create a paragraph with a link to the iframe URL
      const iframeBlock = blockContent as { url: string; height?: number };
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `[Embedded content: ${iframeBlock.url}]`,
            marks: [
              {
                type: "link",
                attrs: { href: iframeBlock.url },
              },
            ],
          },
        ],
      };
    }

    default: {
      console.warn(`Unknown block type: ${blockType}`);
      return null;
    }
  }
};

/**
 * Converts a Leaflet list item to a ProseMirror listItem node
 */
const convertListItem = (
  item: LeafletListItem,
  options: FromLeafletOptions
): Record<string, unknown> => {
  const content: Record<string, unknown>[] = [
    {
      type: "paragraph",
      content: serializeFacets(
        item.content.plaintext,
        item.content.facets,
        options
      ),
    },
  ];

  // Handle nested list items
  if (item.children && item.children.length > 0) {
    content.push({
      type: "bulletList",
      content: item.children.map((child) => convertListItem(child, options)),
    });
  }

  return {
    type: "listItem",
    content,
  };
};

/**
 * Converts Leafet facets to ProseMirror text nodes with marks. Facets use byte
 * offsets to mark sections of text with features like mentions and links.
 */
const serializeFacets = (
  originalText: string,
  facets: Facet[] = [],
  options: FromLeafletOptions = {}
): TextNode[] => {
  if (!facets || facets.length === 0) {
    return [{ type: "text", text: originalText }];
  }

  const textEncoder = new TextEncoder();
  const textBytes = textEncoder.encode(originalText);
  const textDecoder = new TextDecoder();

  // Build a map of byte positions to marks
  // This allows us to handle overlapping facets properly
  const marksByPosition = new Map<number, Set<Mark>>();

  for (const facet of facets) {
    const { byteStart, byteEnd } = facet.index;

    for (const feature of facet.features) {
      let mark: Mark | null = null;

      switch (feature.$type) {
        case "pub.leaflet.richtext.facet#bold": {
          mark = { type: "bold" };
          break;
        }
        case "pub.leaflet.richtext.facet#italic": {
          mark = { type: "italic" };
          break;
        }
        case "pub.leaflet.richtext.facet#link": {
          mark = {
            type: "link",
            attrs: {
              href: feature.uri,
            },
          };
          break;
        }
        case "pub.leaflet.richtext.facet#mention": {
          mark = {
            type: "link",
            attrs: {
              href:
                options.resolveMentionUrl?.(feature.did!) ?? `#${feature.did}`,
            },
          };
          break;
        }
        default: {
          console.warn(`Unknown facet type: ${feature.$type}`);
        }
      }

      if (mark) {
        // Add this mark to all byte positions in the range
        for (let pos = byteStart; pos < byteEnd; pos++) {
          if (!marksByPosition.has(pos)) {
            marksByPosition.set(pos, new Set());
          }
          marksByPosition.get(pos)!.add(mark);
        }
      }
    }
  }

  // Build segments based on mark changes
  const segments: Array<{
    byteStart: number;
    byteEnd: number;
    marks?: Mark[];
  }> = [];

  let currentByte = 0;
  let currentMarks: Set<Mark> = new Set();

  while (currentByte < textBytes.length) {
    const marksAtPosition = marksByPosition.get(currentByte) || new Set();

    // Check if marks changed
    const marksChanged =
      marksAtPosition.size !== currentMarks.size ||
      ![...marksAtPosition].every((mark) => {
        return [...currentMarks].some(
          (cm) => JSON.stringify(cm) === JSON.stringify(mark)
        );
      });

    if (marksChanged && segments.length > 0) {
      // Marks changed, start a new segment
      const lastSegment = segments[segments.length - 1];
      lastSegment.byteEnd = currentByte;
    }

    if (marksChanged || segments.length === 0) {
      // Start a new segment
      currentMarks = new Set(marksAtPosition);
      segments.push({
        byteStart: currentByte,
        byteEnd: textBytes.length, // Will be adjusted later
        marks: currentMarks.size > 0 ? [...currentMarks] : undefined,
      });
    }

    currentByte++;
  }

  // Ensure the last segment ends at the text length
  if (segments.length > 0) {
    segments[segments.length - 1].byteEnd = textBytes.length;
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
