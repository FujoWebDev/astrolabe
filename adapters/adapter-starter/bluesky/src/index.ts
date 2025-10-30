import { RichText, Agent } from "@atproto/api";
import {
  convert as toMdast,
  convertWithPlugins,
  type ConverterMarkPlugin,
  type ConverterPlugin,
  type TreeTransformPlugin,
} from "../../mdast/src/index.js";
import { type DocumentType } from "@tiptap/core";
import { mdastToText } from "./serializer.js";
import {
  DEFAULT_BLUESKY_PLUGINS,
  remarkBracketHeading,
  type RemarkPlugin,
} from "./remark-plugins.js";
import type { Root } from "mdast";

const defaultAgent = new Agent("https://public.api.bsky.app");

export interface MdastToBskyOptions {
  basePath?: string;
  bracketFirstHeading?: boolean;
  mergeParagraphWithHeading?: boolean;
  agent?: Agent;
  mdastPlugins?: RemarkPlugin[];
}

interface BlueskyConversionResult {
  text: RichText;
  images: never[];
}

export const mdastToBsky = async (
  mdast: Root,
  options?: MdastToBskyOptions
): Promise<BlueskyConversionResult> => {
  const transformedMdast = { ...mdast };

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

  return { text, images: [] };
};

export interface BlueskyConvertOptions {
  jsonDocPlugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
  treePlugins?: readonly TreeTransformPlugin[];
  serializerOptions?: MdastToBskyOptions;
}

export const convert = async (
  root: DocumentType,
  options?: BlueskyConvertOptions
): Promise<BlueskyConversionResult | BlueskyConversionResult[]> => {
  const allPlugins = [
    ...(options?.treePlugins ?? []),
    ...(options?.jsonDocPlugins ?? []),
  ];

  const serializerOptions = options?.serializerOptions ?? {};

  // If no tree plugins, use simple conversion
  if (!allPlugins.some((p) => p.pluginType === "tree-transform")) {
    const mdast = toMdast(root, {
      plugins: options?.jsonDocPlugins ?? [],
    }) as Root;

    return mdastToBsky(mdast, {
      ...serializerOptions,
      bracketFirstHeading: serializerOptions.bracketFirstHeading ?? true,
    });
  }

  // Use full pipeline with tree transforms
  const result = convertWithPlugins(
    root,
    (input, context) => toMdast(input, context) as Root,
    allPlugins
  );

  // Convert each tree to Bluesky format
  const converted = await Promise.all(
    result.map(async (mdast) => ({
      ...(await mdastToBsky(mdast, {
        ...serializerOptions,
        bracketFirstHeading: serializerOptions.bracketFirstHeading ?? true,
      })),
    }))
  );

  // Return single result if only one tree, array if multiple (thread splitting)
  return converted.length === 1 ? converted[0] : converted;
};

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
