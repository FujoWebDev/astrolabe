import { type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const fileToBase64 = (file: File): Promise<string> => {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
  reader.readAsDataURL(file);
  return promise;
};

const imageUrlToFile = async (imageUrl: string): Promise<File> => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], "loaded-image.png", { type: blob.type });
};

const isAllowedMimeType = (mimeType: string): boolean => {
  return mimeType.startsWith("image/");
};

const insertImage = async ({
  editor,
  file,
}: {
  editor: Editor;
  file: File;
}): Promise<void> => {
  const imageId = crypto.randomUUID();
  const base64Data = await fileToBase64(file);

  editor
    .chain()
    .insertContent({
      type: "hyperimage",
      attrs: {
        src: base64Data,
        id: imageId,
      },
    })
    .focus()
    .scrollIntoView()
    .run();
};

/**
 * ProseMirror plugin that handles pasting and dropping images
 * Converts images to base64 and inserts them as hyperimage nodes
 *
 * Based on tiptap's file handler plugin:
 * https://github.com/ueberdosis/tiptap/blob/develop/packages/extension-file-handler/src/FileHandlePlugin.ts
 * https://tiptap.dev/docs/editor/extensions/functionality/filehandler
 */
export const PasteDropHandler = (editor: Editor) => {
  return new Plugin({
    key: new PluginKey("hyperimage-pasteAndDrop"),

    props: {
      handleDrop(_view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFiles = Array.from(files).filter((file) =>
          isAllowedMimeType(file.type)
        );
        if (!imageFiles.length) {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();

        imageFiles.forEach((file) => insertImage({ editor, file }));
        return true;
      },

      handlePaste(_view, event) {
        const files = event.clipboardData?.files;
        const imageFiles = Array.from(files ?? []).filter((file) =>
          isAllowedMimeType(file.type)
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
          const images = doc.querySelectorAll("img");

          // We're specifically "firing and forgetting": rather than block on the
          // image being loaded, we will just add it once it is.
          // TODO: this will case problems if multiple images load at different times, and
          // potentially if the user changes their current position.
          images.forEach(async (image) => {
            const file = await imageUrlToFile(image.src);
            insertImage({ editor, file });
          });
          return false;
        }

        // There was no html content, so we can insert the images directly from the file data
        event.preventDefault();
        event.stopPropagation();

        imageFiles.forEach((file) => insertImage({ editor, file }));
        return true;
      },
    },
  });
};
