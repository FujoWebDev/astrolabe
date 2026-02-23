export interface ImageMetadata {
  width: number;
  height: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface StoredImage {
  id: string;
  originalBlob: Blob;
  metadata: ImageMetadata;
  timestamp: number;
  lastUsed: number;
  scopeId?: string;
}

export interface ImageStore {
  store(
    id: string,
    blob: Blob,
    metadata: ImageMetadata,
    scopeId?: string,
  ): Promise<void>;
  get(id: string): Promise<StoredImage | null>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  listIds(): Promise<string[]>;
  clear(): Promise<void>;
  listByScope(scopeId: string): Promise<string[]>;
  deleteByScope(scopeId: string): Promise<void>;
  refreshLastUsed(ids: string[]): Promise<void>;
  deleteOlderThan(maxAgeMs: number): Promise<{ deleted: number }>;
}

export function generateImageId(): string {
  return crypto.randomUUID();
}

export function generateSessionId(): string {
  return `session-${crypto.randomUUID()}`;
}

export interface ReconcileResult {
  deleted: string[];
  active: string[];
}

export async function removeOrphanedImages(
  store: ImageStore,
  scopeId: string,
  activeImageIds: string[],
): Promise<ReconcileResult> {
  const storedIds = await store.listByScope(scopeId);
  const activeSet = new Set(activeImageIds);

  const orphanIds = storedIds.filter((id) => !activeSet.has(id));

  if (orphanIds.length > 0) {
    await store.deleteMany(orphanIds);
    console.info(
      `Reconciled scope "${scopeId}": deleted ${orphanIds.length} orphans`,
    );
  }

  return {
    deleted: orphanIds,
    active: storedIds.filter((id) => activeSet.has(id)),
  };
}
