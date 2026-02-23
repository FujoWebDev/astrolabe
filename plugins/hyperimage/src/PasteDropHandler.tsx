import { type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  processImageForEditor,
  defaultStore,
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

async function insertImage({
  editor,
  file,
  processorConfig,
}: {
  editor: Editor;
  file: File;
  processorConfig?: Partial<ProcessorConfig>;
}): Promise<void> {
  const processed = await processImageForEditor(
    file,
    defaultStore,
    processorConfig,
  );

  editor
    .chain()
    .insertContent({
      type: "hyperimage",
      attrs: {
        src: processed.displaySrc,
        ...(processed.wasStored && { id: processed.id }),
      },
    })
    .focus()
    .scrollIntoView()
    .run();
}

export interface PasteDropHandlerOptions {
  processorConfig?: Partial<ProcessorConfig>;
}

export function PasteDropHandler(
  editor: Editor,
  options: PasteDropHandlerOptions = {},
) {
  const { processorConfig } = options;

  return new Plugin({
    key: new PluginKey("hyperimage-pasteAndDrop"),

    props: {
      handleDrop(_view, event) {
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

        imageFiles.forEach((file) =>
          insertImage({ editor, file, processorConfig }),
        );
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
          const parsedDoc = new DOMParser().parseFromString(
            htmlContent,
            "text/html",
          );
          // TODO: this may cause ordering issues with multiple images but it's
          // good enough for now
          parsedDoc.querySelectorAll("img").forEach(async (image) => {
            const file = await imageUrlToFile(image.src);
            insertImage({ editor, file, processorConfig });
          });
          return true;
        }

        event.preventDefault();
        event.stopPropagation();

        imageFiles.forEach((file) =>
          insertImage({ editor, file, processorConfig }),
        );
        return true;
      },
    },
  });
}
