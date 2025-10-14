import {
  convert as toMdast,
  type ConverterMarkPlugin,
  type ConverterPlugin,
} from "../../mdast/src/index.js";
import { type DocumentType } from "@tiptap/core";
import { mdastToLeafletRichText } from "./to-rich-text.js";
import {
  DEFAULT_LEAFLET_PLUGINS,
  type RemarkPlugin,
} from "./remark-plugins.js";
import type { Root } from "mdast";

export interface MdastToLeafletOptions {
  mdastPlugins?: RemarkPlugin[];
}

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

interface LeafletRichText {
  text: string;
  facets: LeafletFacet[];
}

interface LeafletConversionResult {
  text: LeafletRichText;
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

  const richText = mdastToLeafletRichText(transformedMdast);

  return { text: richText, images: [] };
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
  });
};

export { fromLeafletPost } from "./from.js";
export type { FromLeafletOptions } from "./from.js";
export type { ConverterPlugin, ConverterMarkPlugin, RemarkPlugin };
export { DEFAULT_LEAFLET_PLUGINS } from "./remark-plugins.js";
export { mdastToText } from "./serializer.js";
export { mdastToLeafletRichText } from "./to-rich-text.js";
