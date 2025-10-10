import { RichText, Agent } from "@atproto/api";
import {
  convert as toMdast,
  type ConverterMarkPlugin,
  type ConverterPlugin,
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
// Bluesky happily accepts the public gateway, so we prime an agent up front.

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
  serializerOptions?: MdastToBskyOptions;
}

export const convert = (
  root: DocumentType,
  options?: BlueskyConvertOptions
) => {
  const mdast = toMdast(root, {
    plugins: options?.jsonDocPlugins ?? [],
  }) as Root;

  const serializerOptions = options?.serializerOptions ?? {};

  return mdastToBsky(mdast, {
    ...serializerOptions,
    bracketFirstHeading: serializerOptions.bracketFirstHeading ?? true,
  });
};

export type { ConverterPlugin, ConverterMarkPlugin, RemarkPlugin };
export {
  DEFAULT_BLUESKY_PLUGINS,
  remarkExpandLinks as remarkBlueskyExpandLinks,
  remarkMonospaceCode as remarkBlueskyMonospaceCode,
  remarkBracketHeading as remarkBlueskyBracketHeading,
} from "./remark-plugins.js";
export { mdastToText } from "./serializer.js";
