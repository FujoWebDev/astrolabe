import type {
  ImageBlobStore,
  ImageMetadata,
  StoredBlob,
} from "./blob-store";

export function createInMemoryBlobStore(): ImageBlobStore {
  return createInMemoryBlobStoreWithClock(() => Date.now());
}

export function createInMemoryBlobStoreWithClock(
  now: () => number,
): ImageBlobStore {
  const blobs = new Map<string, StoredBlob>();
  const lastUsed = new Map<string, number>();

  return {
    async store(
      id: string,
      blob: Blob,
      metadata: ImageMetadata,
      scopeId?: string,
    ): Promise<boolean> {
      blobs.set(id, { id, blob, metadata, scopeId });
      lastUsed.set(id, now());
      return true;
    },

    async get(id: string): Promise<StoredBlob | null> {
      return blobs.get(id) ?? null;
    },

    async deleteMany(ids: readonly string[]): Promise<void> {
      for (const id of ids) {
        blobs.delete(id);
        lastUsed.delete(id);
      }
    },

    async listByScope(scopeId: string): Promise<string[]> {
      return [...blobs.values()]
        .filter((storedBlob) => storedBlob.scopeId === scopeId)
        .map((storedBlob) => storedBlob.id);
    },

    async refreshLastUsed(ids: readonly string[]): Promise<void> {
      const refreshedAt = now();
      for (const id of ids) {
        if (blobs.has(id)) {
          lastUsed.set(id, refreshedAt);
        }
      }
    },

    async deleteOlderThan(maxAgeMs: number): Promise<{ deleted: number }> {
      const cutoff = now() - maxAgeMs;
      const idsToDelete = [...lastUsed.entries()]
        .filter(([, usedAt]) => usedAt < cutoff)
        .map(([id]) => id);

      await this.deleteMany(idsToDelete);

      return { deleted: idsToDelete.length };
    },
  };
}
