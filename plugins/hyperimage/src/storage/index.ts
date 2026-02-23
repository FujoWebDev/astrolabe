export {
  blobToDataURL,
  dataURLToBlob,
  createBlobURL,
  getImageDimensions,
} from "../image-utils";

export {
  type ImageStore,
  type StoredImage,
  type ImageMetadata,
  generateImageId,
  generateSessionId,
  removeOrphanedImages,
  type ReconcileResult,
} from "../image-store";

export {
  IndexedDBImageStore,
  createIndexedDBStore,
} from "../indexed-db-image-store";

export {
  processImageForEditor,
  createImageProcessor,
  DEFAULT_PROCESSOR_CONFIG,
  type ProcessorConfig,
  type ProcessedImage,
  type StoragePolicy,
} from "../image-processor";

import { createIndexedDBStore } from "../indexed-db-image-store";
export const defaultStore = createIndexedDBStore();
