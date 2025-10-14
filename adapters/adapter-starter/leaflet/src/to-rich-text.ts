import type {
  Root,
  RootContent,
  Node,
  Parent,
  Link,
  Text,
  InlineCode,
  Html,
  Code,
} from "mdast";

interface LeafletFacet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<{
    $type: string;
    uri?: string;
  }>;
}

interface RichTextResult {
  text: string;
  facets: LeafletFacet[];
}

const hasChildren = (node: Node): node is Node & Parent => {
  return "children" in node && Array.isArray(node.children);
};

/**
 * Pre-processes HTML tags to convert them into proper mark annotations.
 * Handles sequences like <u>text</u> and converts them to underline marks.
 */
const preprocessHtmlMarks = (children: Node[]): Node[] => {
  const result: Node[] = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    // Check for HTML opening tag
    if (node.type === "html") {
      const htmlNode = node as Html;
      const htmlValue = htmlNode.value;

      if (htmlValue === "<u>" && i + 2 < children.length) {
        // Look for pattern: <u> text </u>
        const textNode = children[i + 1];
        const closingTag = children[i + 2];

        if (
          textNode.type !== "html" &&
          closingTag.type === "html" &&
          (closingTag as Html).value === "</u>"
        ) {
          // Convert to underline mark
          result.push({
            ...textNode,
            _underline: true, // Mark for processing
          } as Node);
          i += 3;
          continue;
        }
      }
    }

    result.push(node);
    i++;
  }

  return result;
};

/**
 * Converts mdast inline nodes to plain text while tracking formatting marks
 * and their byte positions for Leaflet facets.
 */
const serializeInlineWithMarks = (
  node: Node,
  currentMarks: string[] = [],
  linkUrl?: string
): Array<{ text: string; marks: string[]; linkUrl?: string }> => {
  // Check if node has underline flag from preprocessing
  const hasUnderline = "_underline" in node && node._underline === true;
  const marks = hasUnderline ? [...currentMarks, "underline"] : currentMarks;

  switch (node.type) {
    case "text": {
      const text = (node as Text).value.replaceAll("\n", " ");
      return [{ text, marks, linkUrl }];
    }
    case "break": {
      return [{ text: "\n", marks, linkUrl }];
    }
    case "link": {
      if (!hasChildren(node)) {
        throw new Error("Link node is missing children");
      }
      const link = node as Link;
      const url = link.url;

      // Recursively process children with link URL
      return link.children.flatMap((child) =>
        serializeInlineWithMarks(child, marks, url)
      );
    }
    case "emphasis": {
      if (!hasChildren(node)) {
        throw new Error("Emphasis node is missing children");
      }
      return node.children.flatMap((child) =>
        serializeInlineWithMarks(child, [...marks, "italic"], linkUrl)
      );
    }
    case "strong": {
      if (!hasChildren(node)) {
        throw new Error("Strong node is missing children");
      }
      return node.children.flatMap((child) =>
        serializeInlineWithMarks(child, [...marks, "bold"], linkUrl)
      );
    }
    case "inlineCode": {
      // Add code mark for inline code
      const codeNode = node as InlineCode;
      const text = codeNode.value;
      return [{ text, marks: [...marks, "code"], linkUrl }];
    }
    case "delete": {
      if (!hasChildren(node)) {
        throw new Error("Delete node is missing children");
      }
      // Add strikethrough mark
      return node.children.flatMap((child) =>
        serializeInlineWithMarks(child, [...marks, "strikethrough"], linkUrl)
      );
    }
    case "html": {
      // Handle HTML tags for marks like underline
      const htmlNode = node as Html;
      const htmlValue = htmlNode.value;
      if (htmlValue === "<u>") {
        throw new Error("We should have already pre-processed underline tags");
      }
      return [];
    }
    default: {
      if (hasChildren(node)) {
        return node.children.flatMap((child) =>
          serializeInlineWithMarks(child, marks, linkUrl)
        );
      }
      return [];
    }
  }
};

/**
 * Converts mdast blocks to Leaflet rich text format with facets.
 */
const blockToRichText = (node: RootContent): RichTextResult | null => {
  switch (node.type) {
    case "paragraph": {
      if (!hasChildren(node)) {
        return null;
      }

      // Pre-process to handle HTML tag marks (like underline)
      const processedChildren = preprocessHtmlMarks(node.children);

      const segments = processedChildren.flatMap((child) =>
        serializeInlineWithMarks(child)
      );

      return segmentsToRichText(segments);
    }
    case "heading": {
      if (!hasChildren(node)) {
        return null;
      }

      const segments = node.children.flatMap((child) =>
        serializeInlineWithMarks(child)
      );

      return segmentsToRichText(segments);
    }
    case "list": {
      // Lists: convert each item and preserve facets
      const itemResults: RichTextResult[] = [];

      for (const item of node.children) {
        const listItemChildren = item.children;
        const childParts: RichTextResult[] = [];

        for (const child of listItemChildren) {
          if (child.type === "paragraph" && hasChildren(child)) {
            const processedChildren = preprocessHtmlMarks(child.children);
            const segments = processedChildren.flatMap((grandChild) =>
              serializeInlineWithMarks(grandChild)
            );
            childParts.push(segmentsToRichText(segments));
          }
        }

        if (childParts.length > 0) {
          const itemText = mergeRichTextResults(childParts, "\n");
          // Add list marker "- " and adjust facet offsets
          const textEncoder = new TextEncoder();
          const markerByteLength = textEncoder.encode("- ").length;

          itemResults.push({
            text: `- ${itemText.text}`,
            facets: itemText.facets.map((facet) => ({
              index: {
                byteStart: facet.index.byteStart + markerByteLength,
                byteEnd: facet.index.byteEnd + markerByteLength,
              },
              features: facet.features,
            })),
          });
        }
      }

      if (itemResults.length === 0) {
        return null;
      }

      return mergeRichTextResults(itemResults, "\n");
    }
    case "blockquote": {
      const parts = node.children
        .map((child) => blockToRichText(child as RootContent))
        .filter((result): result is RichTextResult => result !== null);

      if (parts.length === 0) {
        return null;
      }

      // Merge blockquote parts, preserving facets
      return mergeRichTextResults(parts, "\n\n");
    }
    case "code": {
      const codeNode = node as Code;
      return { text: codeNode.value, facets: [] };
    }
    case "thematicBreak": {
      return { text: "---", facets: [] };
    }
    default: {
      return null;
    }
  }
};

/**
 * Merges multiple rich text results into one, adjusting facet byte offsets.
 */
const mergeRichTextResults = (
  results: RichTextResult[],
  separator: string
): RichTextResult => {
  const textEncoder = new TextEncoder();
  let fullText = "";
  const allFacets: LeafletFacet[] = [];
  let currentByteOffset = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    // Adjust facet byte positions for the current offset
    for (const facet of result.facets) {
      allFacets.push({
        index: {
          byteStart: facet.index.byteStart + currentByteOffset,
          byteEnd: facet.index.byteEnd + currentByteOffset,
        },
        features: facet.features,
      });
    }

    fullText += result.text;
    currentByteOffset += textEncoder.encode(result.text).length;

    // Add separator between results (but not after the last one)
    if (i < results.length - 1) {
      fullText += separator;
      currentByteOffset += textEncoder.encode(separator).length;
    }
  }

  return { text: fullText, facets: allFacets };
};

/**
 * Converts text segments with marks into Leaflet rich text format with facets.
 */
const segmentsToRichText = (
  segments: Array<{ text: string; marks: string[]; linkUrl?: string }>
): RichTextResult => {
  const textEncoder = new TextEncoder();
  let fullText = "";
  const facets: LeafletFacet[] = [];

  for (const segment of segments) {
    const startByteOffset = textEncoder.encode(fullText).length;
    fullText += segment.text;
    const endByteOffset = textEncoder.encode(fullText).length;

    // Skip if no marks and no link
    if (segment.marks.length === 0 && !segment.linkUrl) {
      continue;
    }

    // Create facet features for each mark
    const features: Array<{ $type: string; uri?: string }> = [];

    for (const mark of segment.marks) {
      if (mark === "bold") {
        features.push({ $type: "pub.leaflet.richtext.facet#bold" });
      } else if (mark === "italic") {
        features.push({ $type: "pub.leaflet.richtext.facet#italic" });
      } else if (mark === "code") {
        features.push({ $type: "pub.leaflet.richtext.facet#code" });
      } else if (mark === "underline") {
        features.push({ $type: "pub.leaflet.richtext.facet#underline" });
      } else if (mark === "strikethrough") {
        features.push({ $type: "pub.leaflet.richtext.facet#strikethrough" });
      }
    }

    // Add link if present
    if (segment.linkUrl) {
      features.push({
        $type: "pub.leaflet.richtext.facet#link",
        uri: segment.linkUrl,
      });
    }

    if (features.length > 0) {
      facets.push({
        index: {
          byteStart: startByteOffset,
          byteEnd: endByteOffset,
        },
        features,
      });
    }
  }

  return { text: fullText, facets };
};

/**
 * Converts an mdast tree to Leaflet rich text format.
 * Returns the plain text and facets array.
 */
export const mdastToLeafletRichText = (tree: Root): RichTextResult => {
  const blocks = tree.children
    .map((node) => blockToRichText(node))
    .filter((result): result is RichTextResult => result !== null);

  // Join all blocks with double newlines
  const allText = blocks.map((b) => b.text).join("\n\n");

  // Adjust facet byte offsets for the joined text
  const textEncoder = new TextEncoder();
  let currentByteOffset = 0;
  const allFacets: LeafletFacet[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Adjust each facet's byte positions
    for (const facet of block.facets) {
      allFacets.push({
        index: {
          byteStart: facet.index.byteStart + currentByteOffset,
          byteEnd: facet.index.byteEnd + currentByteOffset,
        },
        features: facet.features,
      });
    }

    // Update offset for next block (add block text + separator)
    currentByteOffset += textEncoder.encode(block.text).length;
    if (i < blocks.length - 1) {
      currentByteOffset += textEncoder.encode("\n\n").length;
    }
  }

  return { text: allText, facets: allFacets };
};
