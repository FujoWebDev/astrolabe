export function generateImageId(): string {
  return crypto.randomUUID();
}

export function generateSessionId(): string {
  return `session-${crypto.randomUUID()}`;
}

/**
 * Information about an image kept alongside the blob.
 *
 * `width` and `height` are the original pixel dimensions. The optional fields
 * are best-effort: they come from the source `File` when one is available.
 */
export type ImageMetadata = {
  width: number;
  height: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

/**
 * A blob as returned from the store, with the scope tag it was filed under.
 */
export interface StoredBlob {
  id: string;
  blob: Blob;
  metadata: ImageMetadata;
  scopeId?: string;
}

/**
 * Backend for keeping the full-fidelity original of every pasted image.
 *
 * Implementations are best-effort: callers must not assume a blob stored in
 * one session is still there in the next. They must, however, behave
 * consistently within a single session — a `get` after a successful `store`
 * returns the blob, a `get` after `deleteMany` returns `null`.
 *
 * See `createIndexedDBBlobStore` (cross-session) and `createInMemoryBlobStore`
 * (page-lifetime) for implementations.
 */
export interface ImageBlobStore {
  /**
   * Saves an original blob under `id`, tagged with `scopeId` for later cleanup.
   *
   * Returns `true` on success, `false` when the backend failed and degraded
   * (for example, IndexedDB unavailable). Callers treat `false` as "no
   * original kept" and proceed without raising.
   */
  store(
    id: string,
    blob: Blob,
    metadata: ImageMetadata,
    scopeId?: string,
  ): Promise<boolean>;

  /**
   * Loads the blob stored under `id`, or `null` if it is not (or no longer)
   * there. Backend failure also surfaces as `null`.
   */
  get(id: string): Promise<StoredBlob | null>;

  /**
   * Removes every blob whose id is in `ids`. Missing ids are a no-op, not an
   * error.
   */
  deleteMany(ids: readonly string[]): Promise<void>;

  /**
   * Returns every id currently stored under the given `scopeId`. The
   * lifecycle uses this to find originals that no longer have a matching node
   * in the document.
   */
  listByScope(scopeId: string): Promise<string[]>;

  /**
   * Marks the listed ids as recently used so the TTL sweep does not delete
   * them while their nodes are still on screen. The lifecycle calls this on
   * attach, on a heartbeat, and when the tab becomes visible again.
   */
  refreshLastUsed(ids: readonly string[]): Promise<void>;

  /**
   * Deletes blobs whose last-used timestamp is older than `maxAgeMs`.
   *
   * Returns the count of deleted blobs. Implementations may throttle or skip
   * the sweep if it ran recently.
   */
  deleteOlderThan(maxAgeMs: number): Promise<{ deleted: number }>;
}
