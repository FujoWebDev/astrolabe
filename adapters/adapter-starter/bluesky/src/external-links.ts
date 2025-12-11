import type { Root, Nodes, Link } from "mdast";
import type { PluginContext } from "@fujocoded/astdapters-mdast-starter";
import type { PendingExternalEmbed, PendingEmbeds } from "./index.js";

const findFirstLink = (node: Nodes): Link | null => {
  if (node.type === "link" && node.url) {
    return node as Link;
  }

  if ("children" in node && node.children) {
    for (const child of node.children) {
      const link = findFirstLink(child);
      if (link) return link;
    }
  }

  return null;
};

/**
 * Extract first link from mdast tree and return as BlueskyExternalEmbed.
 */
const extractFirstLink = (tree: Root): PendingExternalEmbed | null => {
  const link = findFirstLink(tree);
  if (!link) return null;

  // Use text content of the link node as title
  let title = "";
  if (link.children && link.children.length > 0) {
    // Simple text extraction from children
    title = link.children
      .map((child) => {
        if (child.type === "text") return child.value;
        return "";
      })
      .join("")
      .trim();
  }

  if (!title) {
    // If there's no text, use the URL as title
    title = link.url;
  }

  return {
    uri: link.url,
    title,
    description: link.title ?? undefined,
  };
};

/**
 * Bluesky-specific external link plugin.
 *
 * Extracts the first link from each mdast tree and adds it to context.meta.output.embeds
 * as an external embed (link preview card).
 */
export const extractFirstLinkToBlueskyEmbed = () => ({
  pluginType: "tree-transform" as const,
  phase: "post" as const,
  transform: (trees: Root[], context: PluginContext) => {
    // Initialize embeds if not present
    if (!context.meta.output.embeds) {
      context.meta.output.embeds = [];
    }

    // Ensure embeds array has correct length
    while (context.meta.output.embeds.length < trees.length) {
      context.meta.output.embeds.push({});
    }

    // Extract first link from each tree and add to embeds
    trees.forEach((tree, index) => {
      const external = extractFirstLink(tree);

      if (external) {
        const currentEmbeds = context.meta.output.embeds[
          index
        ] as PendingEmbeds;
        context.meta.output.embeds[index] = {
          ...currentEmbeds,
          external,
        };
      }
    });

    return trees;
  },
});
