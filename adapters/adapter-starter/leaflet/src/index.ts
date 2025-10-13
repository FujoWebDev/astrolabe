import { RichText, Agent } from "@atproto/api";
import {
  convert as toMdast,
  type ConverterMarkPlugin,
  type ConverterPlugin,
} from "../../mdast/src/index.js";
import { type DocumentType } from "@tiptap/core";
import { mdastToText } from "./serializer.js";
import {
  DEFAULT_LEAFLET_PLUGINS,
  remarkBracketHeading,
  type RemarkPlugin,
} from "./remark-plugins.js";
import type { Root } from "mdast";

export interface MdastToLeafletOptions {
  basePath?: string;
  bracketFirstHeading?: boolean;
  mergeParagraphWithHeading?: boolean;
  agent?: Agent;
  mdastPlugins?: RemarkPlugin[];
}

interface LeafletConversionResult {
  text: RichText;
  images: never[];
}

export const mdastToLeaflet = async (
  mdast: Root,
  options?: MdastToLeafletOptions
): Promise<LeafletConversionResult> => {
  const transformedMdast = { ...mdast };

  const plugins = options?.mdastPlugins ?? DEFAULT_LEAFLET_PLUGINS;

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

  return { text, images: [] };
};

export interface LeafletConvertOptions {
  jsonDocPlugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
  serializerOptions?: MdastToLeafletOptions;
}

export const convert = (
  root: DocumentType,
  options?: LeafletConvertOptions
) => {
  const mdast = toMdast(root, {
    plugins: options?.jsonDocPlugins ?? [],
  }) as Root;

  const serializerOptions = options?.serializerOptions ?? {};

  return mdastToLeaflet(mdast, {
    ...serializerOptions,
    bracketFirstHeading: serializerOptions.bracketFirstHeading ?? true,
  });
};

export { fromLeafletPost } from "./from.js";
export type { FromLeafletOptions } from "./from.js";
export type { ConverterPlugin, ConverterMarkPlugin, RemarkPlugin };
export {
  DEFAULT_LEAFLET_PLUGINS,
  remarkExpandLinks as remarkBlueskyExpandLinks,
  remarkMonospaceCode as remarkBlueskyMonospaceCode,
  remarkBracketHeading as remarkBlueskyBracketHeading,
} from "./remark-plugins.js";
export { mdastToText } from "./serializer.js";
