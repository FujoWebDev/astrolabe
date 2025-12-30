import { mergeAttributes, type Editor } from "@tiptap/core";
import {
  Image as ImageExtension,
  type ImageOptions,
} from "@tiptap/extension-image";
import { PasteDropHandler } from "./PasteDropHandler";
import "./hyperimage.css";
import type { HtmlHTMLAttributes } from "react";

// TODO: fix once tiptap fixes issues with types https://github.com/ueberdosis/tiptap/issues/6670
type RenderHTMLType = {
  HTMLAttributes: ImageOptions["HTMLAttributes"] &
    HyperimageOptions["HTMLAttributes"];
  node: {
    attrs: Record<string, any>;
  };
};

export type HyperimageOptions = ImageOptions & {
  HTMLAttributes: Partial<{
    "data-astrolb-type": string;
    // TODO: a secret tool that will help us later
    "data-astrolb-id": string;
  }>;
};

export const Plugin = ImageExtension.extend<HyperimageOptions>({
  name: "hyperimage",

  addAttributes() {
    const parentAttributes = this.parent?.();
    return {
      ...parentAttributes,
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.dataset.astrolbId,
        renderHTML: (attributes: { id: string }) => ({
          "data-astrolb-id": attributes.id,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes, node }: RenderHTMLType) {
    const { "data-astrolb-id": id, ...imgAttributes } = HTMLAttributes;

    return [
      "figure",
      {
        "data-astrolb-type": this.name,
        "data-astrolb-id": id,
      },
      [
        "img",
        mergeAttributes(this.options.HTMLAttributes, imgAttributes, {
          src: node.attrs.src,
          alt: node.attrs.alt,
          width: node.attrs.width,
          height: node.attrs.height,
          title: node.attrs.title,
        }),
      ],
    ];
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-astrolb-type='hyperimage']",
        getAttrs: (element: HTMLElement) => {
          const img = element.querySelector<HTMLImageElement>("img");
          if (!img) {
            return false;
          }
          return {
            id: element.dataset.astrolbId,
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            width: img.getAttribute("width"),
            height: img.getAttribute("height"),
            title: img.getAttribute("title"),
          };
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [PasteDropHandler(this.editor)];
  },
});
