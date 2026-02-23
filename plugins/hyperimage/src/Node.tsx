import { mergeAttributes, type Editor } from "@tiptap/core";
import {
  Image as ImageExtension,
  type ImageOptions,
} from "@tiptap/extension-image";
import { PasteDropHandler } from "./PasteDropHandler";
import {
  defaultStore,
  generateSessionId,
  removeOrphanedImages,
  type ProcessorConfig,
} from "./storage";
import "./hyperimage.css";

const IMAGES_HEARTBEAT_MS = 5 * 60 * 1000;

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
    "data-astrolb-id": string;
  }>;
  imageOptions?: Partial<Omit<ProcessorConfig, "scopeId">>;
  /**
   * Document ID for scoped storage cleanup.
   *
   * If provided, orphaned images for this document are cleaned up on editor init.
   * If not provided, a session ID is auto-generated and images can be cleaned up
   * according to age.
   */
  documentId?: string;
};

function setUpStorage(
  editor: Editor,
  scopeId: string,
  trackedIds: Set<string>,
  activeImageIds: string[],
) {
  removeOrphanedImages(defaultStore, scopeId, activeImageIds).catch((err) =>
    console.warn("Failed to reconcile storage:", err),
  );

  const heartbeat = setInterval(() => {
    const ids = [...trackedIds];
    if (ids.length > 0) {
      defaultStore
        .refreshLastUsed(ids)
        .catch((err) => console.warn("Failed to touch images:", err));
    }
  }, IMAGES_HEARTBEAT_MS);

  editor.on("destroy", () => clearInterval(heartbeat));
}

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

  addStorage() {
    return {
      trackedIds: new Set<string>(),
      scopeId: generateSessionId(),
    };
  },

  onCreate() {
    if (this.options.documentId) {
      this.storage.scopeId = this.options.documentId;
    }

    const activeImageIds: string[] = [];
    this.editor.state.doc.descendants((node) => {
      if (node.type.name === this.name && node.attrs.id) {
        activeImageIds.push(node.attrs.id);
        this.storage.trackedIds.add(node.attrs.id);
      }
    });

    const editor = this.editor.options.element;
    if (editor instanceof HTMLElement) {
      editor.setAttribute("data-astrolb-scope-id", this.storage.scopeId);
    }

    setUpStorage(
      this.editor,
      this.storage.scopeId,
      this.storage.trackedIds,
      activeImageIds,
    );
  },

  onTransaction({ transaction }) {
    if (!transaction.docChanged) return;

    const currentIds = new Set<string>();
    transaction.doc.descendants((node) => {
      if (node.type.name === this.name && node.attrs.id) {
        currentIds.add(node.attrs.id);
      }
    });

    const deletedIds = [...this.storage.trackedIds].filter(
      (id) => !currentIds.has(id),
    );

    if (deletedIds.length > 0) {
      defaultStore
        .deleteMany(deletedIds)
        .catch((err) => console.warn("Failed to delete images:", err));
    }

    this.storage.trackedIds = currentIds;
  },

  addProseMirrorPlugins() {
    return [
      PasteDropHandler(this.editor, {
        processorConfig: {
          ...this.options.imageOptions,
          scopeId: this.storage.scopeId,
        },
      }),
    ];
  },
});
