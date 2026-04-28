import type {
  ImageBlobStore,
  ImageMetadata,
  StoredBlob,
} from "./blob-store";
import { HEARTBEAT_MS } from "./lifecycle";

const DB_NAME = "AstrolabeImageStorage";
const DB_VERSION = 1;
const STORE_NAME = "images";
const LAST_SWEEP_KEY = "__astrolabe_meta:lastSweepAt";
// If a versionchange is blocked by another tab, degrade rather than hanging paste.
const OPEN_BLOCKED_TIMEOUT_MS = 1_000;

export interface RawRow extends StoredBlob {
  timestamp: number;
  lastUsed: number;
}

interface LastSweepRow {
  id: typeof LAST_SWEEP_KEY;
  lastSweepAt: number;
}

function isStoredBlobRow(row: RawRow | LastSweepRow): row is RawRow {
  return row.id !== LAST_SWEEP_KEY;
}

export class IndexedDBBlobStore implements ImageBlobStore {
  private db: IDBDatabase | null = null;
  private isDegraded = false;
  private hasWarnedUnavailable = false;

  private degrade(error: unknown): void {
    this.isDegraded = true;
    this.db = null;

    if (!this.hasWarnedUnavailable) {
      this.hasWarnedUnavailable = true;
      console.warn(
        "[hyperimage] IDB unavailable, originals will not persist:",
        error,
      );
    }
  }

  private async ensureDbOpen(): Promise<IDBDatabase> {
    if (this.isDegraded) {
      throw new Error("IndexedDB unavailable");
    }

    if (this.db && this.db.objectStoreNames.contains(STORE_NAME)) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      let blockedTimeout: ReturnType<typeof setTimeout> | undefined;
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        blockedTimeout = setTimeout(() => {
          reject(new Error("IndexedDB open blocked"));
        }, OPEN_BLOCKED_TIMEOUT_MS);
      };

      request.onsuccess = () => {
        if (blockedTimeout) {
          clearTimeout(blockedTimeout);
        }

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
  ): Promise<boolean> {
    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const now = Date.now();
      const imageData: RawRow = {
        id,
        blob,
        metadata,
        timestamp: now,
        lastUsed: now,
        scopeId,
      };

      const request = store.put(imageData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    }).catch((error) => {
      this.degrade(error);
      return false;
    });
  }

  async get(id: string): Promise<StoredBlob | null> {
    const row = await this.getRaw(id);
    if (!row) return null;

    return {
      id: row.id,
      blob: row.blob,
      metadata: row.metadata,
      scopeId: row.scopeId,
    };
  }

  async getRaw(id: string): Promise<RawRow | null> {
    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as RawRow | LastSweepRow | undefined;
        resolve(result && isStoredBlobRow(result) ? result : null);
      };
    }).catch((error) => {
      this.degrade(error);
      return null;
    });
  }

  async deleteMany(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;

    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      for (const id of ids) {
        store.delete(id);
      }
    }).catch((error) => {
      this.degrade(error);
    });
  }

  async listByScope(scopeId: string): Promise<string[]> {
    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("scopeId");
      const request = index.getAllKeys(IDBKeyRange.only(scopeId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    }).catch((error) => {
      this.degrade(error);
      return [];
    });
  }

  async refreshLastUsed(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;

    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return;
    }
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
    }).catch((error) => {
      this.degrade(error);
    });
  }

  async deleteOlderThan(maxAgeMs: number): Promise<{ deleted: number }> {
    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return { deleted: 0 };
    }
    const sweepStartedAt = Date.now();
    const cutoff = sweepStartedAt - maxAgeMs;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("lastUsed");
      const range = IDBKeyRange.upperBound(cutoff);

      const idsToDelete: string[] = [];
      let skipped = false;

      const lastSweepRequest = store.get(LAST_SWEEP_KEY);

      lastSweepRequest.onerror = () => reject(lastSweepRequest.error);

      lastSweepRequest.onsuccess = () => {
        const lastSweep = lastSweepRequest.result as LastSweepRow | undefined;
        if (
          lastSweep &&
          sweepStartedAt - lastSweep.lastSweepAt < HEARTBEAT_MS
        ) {
          skipped = true;
          return;
        }

        const cursorRequest = index.openCursor(range);

        cursorRequest.onerror = () => reject(cursorRequest.error);

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const row = cursor.value as RawRow | LastSweepRow;
            if (isStoredBlobRow(row)) {
              idsToDelete.push(row.id);
            }
            cursor.continue();
          } else {
            for (const id of idsToDelete) {
              store.delete(id);
            }
            store.put({ id: LAST_SWEEP_KEY, lastSweepAt: sweepStartedAt });
          }
        };
      };

      transaction.oncomplete = () =>
        resolve({ deleted: skipped ? 0 : idsToDelete.length });
      transaction.onerror = () => reject(transaction.error);
    }).catch((error) => {
      this.degrade(error);
      return { deleted: 0 };
    });
  }

  async listAll(): Promise<StoredBlob[]> {
    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () =>
        resolve(
          (request.result as Array<RawRow | LastSweepRow>)
            .filter(isStoredBlobRow)
            .map((row) => ({
              id: row.id,
              blob: row.blob,
              metadata: row.metadata,
              scopeId: row.scopeId,
            })),
        );
    }).catch((error) => {
      this.degrade(error);
      return [];
    });
  }

  async clear(): Promise<void> {
    let database: IDBDatabase;
    try {
      database = await this.ensureDbOpen();
    } catch (error) {
      this.degrade(error);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    }).catch((error) => {
      this.degrade(error);
    });
  }
}

export function createIndexedDBBlobStore(): ImageBlobStore {
  return new IndexedDBBlobStore();
}
