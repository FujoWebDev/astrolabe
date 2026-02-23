import { blobToDataURL, getImageDimensions } from "./image-utils";
import {
  type ImageStore,
  type ImageMetadata,
  generateImageId,
} from "./image-store";

export type StoragePolicy = "always" | "when-resized" | "never";

export interface ProcessorConfig {
  maxWidth: number;
  maxSizeBytes: number;
  quality: number;
  storagePolicy: StoragePolicy;
  scopeId?: string;
}

export const DEFAULT_PROCESSOR_CONFIG: Omit<ProcessorConfig, "scopeId"> = {
  maxWidth: 800,
  maxSizeBytes: 500 * 1024, // 500KB
  quality: 0.85,
  storagePolicy: "when-resized",
};

export interface ProcessedImage {
  id: string;
  displaySrc: string;
  originalWidth: number;
  originalHeight: number;
  wasResized: boolean;
  wasStored: boolean;
}

function loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

async function resizeBlob(
  blob: Blob,
  maxWidth: number,
  quality: number,
): Promise<Blob> {
  const { width, height } = await getImageDimensions(blob);

  if (width <= maxWidth) {
    return blob;
  }

  const aspectRatio = height / width;
  const newHeight = Math.round(maxWidth * aspectRatio);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const img = await loadBlobAsImage(blob);

  canvas.width = maxWidth;
  canvas.height = newHeight;
  ctx.drawImage(img, 0, 0, maxWidth, newHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (resizedBlob) => {
        if (resizedBlob) {
          resolve(resizedBlob);
        } else {
          reject(new Error("Failed to create resized blob"));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

function shouldStore(
  policy: StoragePolicy,
  wasResized: boolean,
  hasStore: boolean,
): boolean {
  if (!hasStore) return false;

  switch (policy) {
    case "always":
      return true;
    case "when-resized":
      return wasResized;
    case "never":
      return false;
  }
}

export async function processImageForEditor(
  file: File | Blob,
  store?: ImageStore,
  config: Partial<ProcessorConfig> = {},
): Promise<ProcessedImage> {
  const { maxWidth, maxSizeBytes, quality, storagePolicy, scopeId } = {
    ...DEFAULT_PROCESSOR_CONFIG,
    ...config,
  };

  const imageId = generateImageId();
  const { width: originalWidth, height: originalHeight } =
    await getImageDimensions(file);

  const needsResize = file.size > maxSizeBytes || originalWidth > maxWidth;
  const displayBlob = needsResize
    ? await resizeBlob(file, maxWidth, quality).catch((error) => {
        console.warn("Resize failed, using original:", error);
        return file;
      })
    : file;
  const wasResized = displayBlob !== file;

  const metadata: ImageMetadata = {
    width: originalWidth,
    height: originalHeight,
    mimeType: file.type,
    fileSize: file.size,
    ...(file instanceof File && { fileName: file.name }),
  };

  const wasStored = shouldStore(storagePolicy, wasResized, !!store);
  if (wasStored && store) {
    await store.store(imageId, file, metadata, scopeId);
  }

  const displaySrc = await blobToDataURL(displayBlob);

  return {
    id: imageId,
    displaySrc,
    originalWidth,
    originalHeight,
    wasResized,
    wasStored,
  };
}

export function createImageProcessor(
  store?: ImageStore,
  defaultConfig: Partial<ProcessorConfig> = {},
) {
  return {
    process(
      file: File | Blob,
      config?: Partial<ProcessorConfig>,
    ): Promise<ProcessedImage> {
      return processImageForEditor(file, store, {
        ...defaultConfig,
        ...config,
      });
    },
  };
}

