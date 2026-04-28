import { type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  generateImageId,
  processImageForEditor,
  type ImageBlobStore,
  type ProcessorConfig,
} from "./storage";

async function imageUrlToFile(imageUrl: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const filename = new URL(imageUrl).pathname.split("/").pop() || "image";
  return new File([blob], filename, { type: blob.type });
}

function isAllowedMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Synchronously inserts an empty hyperimage placeholder at the editor's
 * current selection so the doc anchors the eventual content. Returns the
 * placeholder id; subsequent edits cannot displace it because ProseMirror
 * tracks it as a node, not a stored position.
 */
function insertPlaceholder(editor: Editor, atPos?: number): string {
  const placeholderId = generateImageId();
  const content = {
    type: "hyperimage",
    attrs: {
      id: placeholderId,
      src: "",
      loading: true,
    },
  };
  const chain =
    atPos !== undefined
      ? editor.chain().insertContentAt(atPos, content)
      : editor.chain().insertContent(content);
  chain.focus().scrollIntoView().run();
  return placeholderId;
}

function fillPlaceholder(
  editor: Editor,
  placeholderId: string,
  attrs: Record<string, unknown>,
): void {
  editor.commands.command(({ tr, state }) => {
    let found = false;
    state.doc.descendants((node, pos) => {
      if (found) return false;
      if (
        node.type.name === "hyperimage" &&
        node.attrs.id === placeholderId
      ) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
        // Keep the async fill out of undo history. Undoing the original
        // placeholder insert will remove the node regardless of its current
        // attrs, so undo correctly reverts the whole paste/drop instead of
        // popping back to the loading skeleton.
        tr.setMeta("addToHistory", false);
        found = true;
        return false;
      }
    });
    return found;
  });
}

function removePlaceholder(editor: Editor, placeholderId: string): void {
  editor.commands.command(({ tr, state }) => {
    let found = false;
    state.doc.descendants((node, pos) => {
      if (found) return false;
      if (
        node.type.name === "hyperimage" &&
        node.attrs.id === placeholderId
      ) {
        tr.delete(pos, pos + node.nodeSize);
        tr.setMeta("addToHistory", false);
        found = true;
        return false;
      }
    });
    return found;
  });
}

async function processIntoPlaceholder({
  editor,
  file,
  placeholderId,
  storage,
  processorConfig,
}: {
  editor: Editor;
  file: File;
  placeholderId: string;
  storage: ImageBlobStore;
  processorConfig?: Partial<ProcessorConfig>;
}): Promise<void> {
  try {
    const processed = await processImageForEditor(
      file,
      storage,
      processorConfig,
    );
    fillPlaceholder(editor, placeholderId, {
      id: processed.id,
      src: processed.displaySrc,
      isPreview: processed.wasResized,
      originalMissing: processed.wasResized && !processed.wasStored,
      loading: false,
    });
  } catch (err) {
    console.warn("[hyperimage] failed to process image:", err);
    removePlaceholder(editor, placeholderId);
  }
}

export interface PasteDropHandlerOptions {
  storage: ImageBlobStore;
  processorConfig?: Partial<ProcessorConfig>;
}

/**
 * ProseMirror plugin that handles pasting and dropping images.
 *
 * Inserts a `loading` placeholder hyperimage node synchronously at the cursor
 * for each image, then resolves each placeholder asynchronously as processing
 * completes. The placeholder is a real document node, so ProseMirror keeps
 * its position correct even if the user keeps typing while images load.
 *
 * Based on tiptap's file handler plugin:
 * https://github.com/ueberdosis/tiptap/blob/develop/packages/extension-file-handler/src/FileHandlePlugin.ts
 * https://tiptap.dev/docs/editor/extensions/functionality/filehandler
 */
export function PasteDropHandler(
  editor: Editor,
  options: PasteDropHandlerOptions,
) {
  const { processorConfig, storage } = options;

  return new Plugin({
    key: new PluginKey("hyperimage-pasteAndDrop"),

    props: {
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFiles = Array.from(files).filter((file) =>
          isAllowedMimeType(file.type),
        );
        if (!imageFiles.length) {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();

        // Anchor the first placeholder at the drop point. Subsequent
        // placeholders ride the cursor that insertContentAt leaves behind.
        const dropPos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        const placeholders = imageFiles.map((_, i) =>
          insertPlaceholder(editor, i === 0 ? dropPos?.pos : undefined),
        );
        imageFiles.forEach((file, i) => {
          void processIntoPlaceholder({
            editor,
            file,
            placeholderId: placeholders[i],
            storage,
            processorConfig,
          });
        });
        return true;
      },

      handlePaste(_view, event) {
        const files = event.clipboardData?.files;
        const imageFiles = Array.from(files ?? []).filter((file) =>
          isAllowedMimeType(file.type),
        );

        if (!imageFiles.length) {
          return false;
        }

        const htmlContent = event.clipboardData?.getData("text/html");
        if (htmlContent) {
          // When there is html but also file data, it means we can extract the
          // images from the html and insert them as nodes. This is useful for
          // gifs or webms as they are not copied correctly when moved as files
          // and will end up transformed into a PNG. This way, we can instead
          // keep the original image type and data.
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, "text/html");
          const images = Array.from(doc.querySelectorAll("img"));

          event.preventDefault();
          event.stopPropagation();

          const placeholders = images.map(() => insertPlaceholder(editor));
          images.forEach((image, i) => {
            void (async () => {
              try {
                const file = await imageUrlToFile(image.src);
                await processIntoPlaceholder({
                  editor,
                  file,
                  placeholderId: placeholders[i],
                  storage,
                  processorConfig,
                });
              } catch (err) {
                console.warn("[hyperimage] failed to fetch pasted image:", err);
                removePlaceholder(editor, placeholders[i]);
              }
            })();
          });
          return true;
        }

        // There was no html content, so we can insert the images directly from the file data
        event.preventDefault();
        event.stopPropagation();

        const placeholders = imageFiles.map(() => insertPlaceholder(editor));
        imageFiles.forEach((file, i) => {
          void processIntoPlaceholder({
            editor,
            file,
            placeholderId: placeholders[i],
            storage,
            processorConfig,
          });
        });
        return true;
      },
    },
  });
}
