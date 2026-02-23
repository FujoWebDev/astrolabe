import type { ImageStore, ImageMetadata, StoredImage } from "./image-store";

const DB_NAME = "AstrolabeImageStorage";
const DB_VERSION = 1;
const STORE_NAME = "images";

export class IndexedDBImageStore implements ImageStore {
  private db: IDBDatabase | null = null;

  private async ensureDbOpen(): Promise<IDBDatabase> {
    // Re-open if connection was lost or invalidated (e.g. by a version change in another tab)
    if (this.db && this.db.objectStoreNames.contains(STORE_NAME)) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onclose = () => {
          console.warn("Database connection closed");
          this.db = null;
        };

        this.db.onerror = (event) => {
          console.error("Database error:", event);
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("scopeId", "scopeId", { unique: false });
        store.createIndex("lastUsed", "lastUsed", { unique: false });
      };
    });
  }

  async store(
    id: string,
    blob: Blob,
    metadata: ImageMetadata,
    scopeId?: string,
  ): Promise<void> {
    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const now = Date.now();
      const imageData: StoredImage = {
        id,
        originalBlob: blob,
        metadata,
        timestamp: now,
        lastUsed: now,
        scopeId,
      };

      const request = store.put(imageData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(id: string): Promise<StoredImage | null> {
    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async delete(id: string): Promise<void> {
    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      for (const id of ids) {
        store.delete(id);
      }
    });
  }

  async listIds(): Promise<string[]> {
    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async clear(): Promise<void> {
    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async listByScope(scopeId: string): Promise<string[]> {
    const database = await this.ensureDbOpen();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("scopeId");
      const request = index.getAllKeys(IDBKeyRange.only(scopeId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async deleteByScope(scopeId: string): Promise<void> {
    const ids = await this.listByScope(scopeId);
    await this.deleteMany(ids);
  }

  async refreshLastUsed(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const database = await this.ensureDbOpen();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      for (const id of ids) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const record = getReq.result;
          if (record) {
            record.lastUsed = now;
            store.put(record);
          }
        };
      }
    });
  }

  async deleteOlderThan(maxAgeMs: number): Promise<{ deleted: number }> {
    const database = await this.ensureDbOpen();
    const cutoff = Date.now() - maxAgeMs;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("lastUsed");
      const range = IDBKeyRange.upperBound(cutoff);

      const idsToDelete: string[] = [];

      const cursorRequest = index.openCursor(range);

      cursorRequest.onerror = () => reject(cursorRequest.error);

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          idsToDelete.push(cursor.value.id);
          cursor.continue();
        } else {
          for (const id of idsToDelete) {
            store.delete(id);
          }
        }
      };

      transaction.oncomplete = () => resolve({ deleted: idsToDelete.length });
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export function createIndexedDBStore(): ImageStore {
  return new IndexedDBImageStore();
}
