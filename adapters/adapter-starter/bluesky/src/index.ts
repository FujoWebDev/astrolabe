import {
  RichText,
  Agent,
  AppBskyFeedPost,
  BlobRef,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from "@atproto/api";
import {
  convert as convertToMdast,
  type ConverterMarkPlugin,
  type ConverterPlugin,
  type TreeTransformPlugin,
} from "@fujocoded/astdapters-mdast-starter";
import { type DocumentType } from "@tiptap/core";
import { mdastToText } from "./serializer.js";
import {
  DEFAULT_BLUESKY_PLUGINS,
  remarkBracketHeading,
  type RemarkPlugin,
} from "./remark-plugins.js";
import type { Root } from "mdast";

const defaultAgent = new Agent("https://public.api.bsky.app");

export interface PendingImageEmbed {
  id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface PendingExternalEmbed {
  uri: string;
  title: string;
  description?: string;
  thumb?: string;
}

export interface PendingEmbeds {
  images?: PendingImageEmbed[];
  external?: PendingExternalEmbed;
  // TODO: videos, records, etc.
}

declare module "@fujocoded/astdapters-mdast-starter" {
  interface PluginMetadataOutput {
    embeds: PendingEmbeds[];
  }
}

export interface MdastToBskyOptions {
  basePath?: string;
  bracketFirstHeading?: boolean;
  mergeParagraphWithHeading?: boolean;
  agent?: Agent;
  mdastPlugins?: RemarkPlugin[];
}

// See: https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/feed/post.json
export type BlueskyDraftResults = Array<{
  record: {
    text: RichText;
  };
  pendingEmbeds: PendingEmbeds;
}>;

export interface UploadedImage {
  id: string;
  blob: Parameters<typeof BlobRef.fromJsonRef>[0];
}

export const mdastToBsky = async (
  mdast: Root,
  options?: MdastToBskyOptions
): Promise<{ text: RichText }> => {
  const transformedMdast = structuredClone(mdast);

  const plugins = options?.mdastPlugins ?? DEFAULT_BLUESKY_PLUGINS;

  for (const plugin of plugins) {
    plugin(transformedMdast, options);
  }

  if (options?.bracketFirstHeading) {
    remarkBracketHeading({
      mergeParagraph: options?.mergeParagraphWithHeading ?? true,
    })(transformedMdast);
  }

  const plainText = mdastToText(transformedMdast);

  const text = new RichText({
    text: plainText,
  });
  const agent = options?.agent ?? defaultAgent;
  await text.detectFacets(agent);

  return { text };
};

export interface BlueskyConvertOptions {
  jsonDocPlugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
  treePlugins?: readonly TreeTransformPlugin[];
  serializerOptions?: MdastToBskyOptions;
}

export const convert = async (
  root: DocumentType,
  options?: BlueskyConvertOptions
): Promise<BlueskyDraftResults> => {
  const allPlugins = [
    ...(options?.treePlugins ?? []),
    ...(options?.jsonDocPlugins ?? []),
  ];

  const serializerOptions = options?.serializerOptions ?? {
    bracketFirstHeading: true,
  };

  const { trees, context } = await convertToMdast(root, {
    plugins: allPlugins,
  });

  // Read embeds from context (post-transform plugins have run)
  const embedsPerTree = context.meta.output?.embeds ?? [];

  const records = await Promise.all(
    trees.map(async (mdast, i) => ({
      record: await mdastToBsky(mdast, serializerOptions),
      pendingEmbeds: embedsPerTree[i] ?? {},
    }))
  );

  return records;
};

export function finalizeRecords(
  draft: BlueskyDraftResults,
  uploadedImages: UploadedImage[]
): AppBskyFeedPost.Record[] {
  const blobMap = new Map(
    uploadedImages.map((img) => [img.id, BlobRef.fromJsonRef(img.blob)])
  );

  return draft.map(({ record, pendingEmbeds }): AppBskyFeedPost.Record => {
    // Determine embed type (priority: images > external)
    // TODO: Support recordWithMedia for combining images + external
    const images = pendingEmbeds.images ?? [];
    if (images.length > 0) {
      const imagesEmbed: AppBskyEmbedImages.Main & {
        $type: "app.bsky.embed.images";
      } = {
        $type: "app.bsky.embed.images",
        images: images.map((img): AppBskyEmbedImages.Image => {
          const blob = blobMap.get(img.id);
          if (!blob) {
            throw new Error(`Missing blob for image ${img.id}`);
          }
          return {
            alt: img.alt ?? "",
            image: blob,
            aspectRatio: {
              width: img.width ?? 1,
              height: img.height ?? 1,
            },
          };
        }),
      };
      return {
        $type: "app.bsky.feed.post",
        text: record.text.text,
        facets: record.text.facets,
        createdAt: new Date().toISOString(),
        embed: imagesEmbed,
      };
    }

    if (pendingEmbeds.external) {
      const thumb = pendingEmbeds.external.thumb
        ? blobMap.get(pendingEmbeds.external.thumb)
        : undefined;
      const externalEmbed: AppBskyEmbedExternal.Main & {
        $type: "app.bsky.embed.external";
      } = {
        $type: "app.bsky.embed.external",
        external: {
          uri: pendingEmbeds.external.uri,
          title: pendingEmbeds.external.title,
          description: pendingEmbeds.external.description ?? "",
          thumb,
        },
      };
      return {
        $type: "app.bsky.feed.post",
        text: record.text.text,
        facets: record.text.facets,
        createdAt: new Date().toISOString(),
        embed: externalEmbed,
      };
    }

    return {
      $type: "app.bsky.feed.post",
      text: record.text.text,
      facets: record.text.facets,
      createdAt: new Date().toISOString(),
    };
  });
}

export { fromBlueskyPost } from "./from.js";
export type { FromBlueskyOptions } from "./from.js";
export type {
  ConverterPlugin,
  ConverterMarkPlugin,
  TreeTransformPlugin,
  RemarkPlugin,
};
export {
  DEFAULT_BLUESKY_PLUGINS,
  remarkExpandLinks as remarkBlueskyExpandLinks,
  remarkMonospaceCode as remarkBlueskyMonospaceCode,
  remarkBracketHeading as remarkBlueskyBracketHeading,
} from "./remark-plugins.js";
export { mdastToText } from "./serializer.js";
export { extractFirstLinkToBlueskyEmbed } from "./external-links.js";
