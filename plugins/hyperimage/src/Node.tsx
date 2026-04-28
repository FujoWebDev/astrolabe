import { mergeAttributes } from "@tiptap/core";
import {
  Image as ImageExtension,
  type ImageOptions,
} from "@tiptap/extension-image";
import { PasteDropHandler } from "./PasteDropHandler";
import {
  generateSessionId,
  HyperimageLifecycle,
  type ImageBlobStore,
  type ProcessorConfig,
} from "./storage";
import "./hyperimage.css";

// TODO: fix once tiptap fixes issues with types https://github.com/ueberdosis/tiptap/issues/6670
type RenderHTMLType = {
  HTMLAttributes: ImageOptions["HTMLAttributes"] &
    HyperimageOptions["HTMLAttributes"];
  node: {
    attrs: Record<string, any>;
  };
};

/**
 * Configuration accepted by `Plugin.configure(...)`.
 *
 * Extends TipTap's `ImageOptions` with the fields hyperimage needs to keep
 * originals around and resize previews.
 */
export type HyperimageOptions = ImageOptions & {
  HTMLAttributes: Partial<{
    "data-astrolb-type": string;
    "data-astrolb-id": string;
  }>;
  /**
   * Optional preview-pass settings. Controls how big a pasted image is allowed
   * to get before it is resized for display, and when the original is kept in
   * `storage`.
   *
   * Omit to use the defaults from `DEFAULT_PROCESSOR_CONFIG` (max 800px wide,
   * re-encode above 500KB at quality 0.85, keep originals only when resized).
   */
  imageOptions?: Partial<Omit<ProcessorConfig, "scopeId">>;
  /**
   * Required. Backend for keeping the full-fidelity original of every pasted
   * image. Use `createIndexedDBBlobStore()` for cross-session persistence or
   * `createInMemoryBlobStore()` when originals only need to outlive the
   * current page.
   */
  storage: ImageBlobStore;
  /**
   * Optional tag for every original stored from this editor.
   *
   * When provided, originals tagged with this id survive cleanup on the next
   * load of the same document. When omitted, a fresh session id is generated
   * each load and originals from previous sessions get swept by the TTL.
   *
   * Pass your draft id, post id, or any stable string that identifies the
   * document.
   */
  documentId?: string;
};

/**
 * TipTap extension for images with paste/drop, preview resizing, and
 * original-blob retention.
 *
 * Renders as `<figure data-astrolb-type="hyperimage"><img></figure>`, with a
 * `data-astrolb-id` linking each node to its original in `storage`. See
 * `HyperimageOptions` for the configurable surface.
 */
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
      isPreview: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.dataset.astrolbIsPreview === "true",
        renderHTML: (attributes: { isPreview: boolean }) =>
          attributes.isPreview ? { "data-astrolb-is-preview": "true" } : {},
      },
      originalMissing: {
        default: false,
        parseHTML: () => false,
        renderHTML: () => ({}),
      },
      loading: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.dataset.astrolbLoading === "true",
        renderHTML: (attributes: { loading: boolean }) =>
          attributes.loading ? { "data-astrolb-loading": "true" } : {},
      },
    };
  },

  renderHTML({ HTMLAttributes, node }: RenderHTMLType) {
    const {
      "data-astrolb-id": id,
      "data-astrolb-is-preview": isPreview,
      "data-astrolb-loading": loading,
      ...imgAttributes
    } = HTMLAttributes;

    return [
      "figure",
      {
        "data-astrolb-type": this.name,
        "data-astrolb-id": id,
        ...(isPreview && {
          "data-astrolb-is-preview": isPreview,
        }),
        ...(loading && {
          "data-astrolb-loading": loading,
        }),
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
            isPreview: element.dataset.astrolbIsPreview === "true",
            originalMissing: false,
            loading: element.dataset.astrolbLoading === "true",
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

  addStorage() {
    const scopeId = this.options.documentId ?? generateSessionId();
    const storage = this.options.storage;

    if (!storage) {
      throw new Error(
        "Hyperimage requires storage. Configure the extension with an ImageBlobStore.",
      );
    }

    return {
      lifecycle: new HyperimageLifecycle({
        storage,
        scopeId,
        nodeName: this.name,
        reportError: (err, where) => console.warn(`[hyperimage:${where}]`, err),
      }),
      scopeId,
      storage,
    };
  },

  onCreate() {
    const editor = this.editor.options.element;
    if (editor instanceof HTMLElement) {
      editor.setAttribute("data-astrolb-scope-id", this.storage.scopeId);
    }
    this.storage.lifecycle.attach(this.editor).catch((err: unknown) => {
      console.warn("[hyperimage] lifecycle.attach failed:", err);
    });
  },

  onTransaction({ transaction }) {
    if (!transaction.docChanged) return;
    this.storage.lifecycle.onDocChange(transaction.doc);
  },

  addProseMirrorPlugins() {
    return [
      PasteDropHandler(this.editor, {
        storage: this.storage.storage,
        processorConfig: {
          ...this.options.imageOptions,
          scopeId: this.storage.scopeId,
        },
      }),
    ];
  },
});
