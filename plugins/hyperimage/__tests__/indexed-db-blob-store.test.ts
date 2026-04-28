import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createIndexedDBBlobStore,
  IndexedDBBlobStore,
} from "../src/storage/indexed-db-store";
import { HEARTBEAT_MS } from "../src/storage/lifecycle";

const metadata = {
  width: 320,
  height: 240,
  fileName: "indexed.png",
  fileSize: 18,
  mimeType: "image/png",
};

describe("createIndexedDBBlobStore", () => {
  beforeEach(async () => {
    await new IndexedDBBlobStore().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("round-trips stored blobs by id", async () => {
    const store = createIndexedDBBlobStore();
    const blob = new Blob(["indexed image"], { type: "image/png" });

    await expect(store.store("image-1", blob, metadata, "scope-a")).resolves.toBe(
      true,
    );

    await expect(store.get("image-1")).resolves.toMatchObject({
      id: "image-1",
      blob,
      metadata,
      scopeId: "scope-a",
    });
  });

  test("deletes many blobs by id", async () => {
    const store = createIndexedDBBlobStore();
    const firstBlob = new Blob(["first"]);
    const secondBlob = new Blob(["second"]);

    await store.store("image-1", firstBlob, metadata);
    await store.store("image-2", secondBlob, metadata);

    await store.deleteMany(["image-1"]);

    await expect(store.get("image-1")).resolves.toBeNull();
    await expect(store.get("image-2")).resolves.toMatchObject({
      id: "image-2",
      blob: secondBlob,
    });
  });

  test("lists only blobs in the requested scope", async () => {
    const store = createIndexedDBBlobStore();

    await store.store("image-1", new Blob(["one"]), metadata, "scope-a");
    await store.store("image-2", new Blob(["two"]), metadata, "scope-b");
    await store.store("image-3", new Blob(["three"]), metadata, "scope-a");
    await store.store("image-4", new Blob(["four"]), metadata);

    await expect(store.listByScope("scope-a")).resolves.toEqual([
      "image-1",
      "image-3",
    ]);
  });

  test("refreshes last-used time for selected blobs", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000);
    const store = new IndexedDBBlobStore();

    await store.store("stale", new Blob(["stale"]), metadata);
    await store.store("fresh", new Blob(["fresh"]), metadata);

    vi.setSystemTime(2_000);
    await store.refreshLastUsed(["fresh"]);

    await expect(store.getRaw("stale")).resolves.toMatchObject({
      lastUsed: 1_000,
    });
    await expect(store.getRaw("fresh")).resolves.toMatchObject({
      lastUsed: 2_000,
    });
  });

  test("deletes only blobs older than the max age", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000);
    const store = new IndexedDBBlobStore();

    await store.store("old", new Blob(["old"]), metadata);
    vi.setSystemTime(1_600);
    await store.store("new", new Blob(["new"]), metadata);

    vi.setSystemTime(2_100);
    await expect(store.deleteOlderThan(800)).resolves.toEqual({ deleted: 1 });
    await expect(store.get("old")).resolves.toBeNull();
    await expect(store.get("new")).resolves.toMatchObject({ id: "new" });
  });

  test("exposes concrete debug helpers outside the interface", async () => {
    const store = new IndexedDBBlobStore();

    await store.store("debug", new Blob(["debug"]), metadata, "scope-a");

    await expect(store.listAll()).resolves.toMatchObject([
      { id: "debug", metadata, scopeId: "scope-a" },
    ]);
    await expect(store.getRaw("debug")).resolves.toMatchObject({
      id: "debug",
      metadata,
      scopeId: "scope-a",
      timestamp: expect.any(Number),
      lastUsed: expect.any(Number),
    });

    await store.clear();

    await expect(store.listAll()).resolves.toEqual([]);
  });

  test("debounces TTL sweeps across store instances", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000);
    const firstTab = new IndexedDBBlobStore();
    const secondTab = new IndexedDBBlobStore();

    await firstTab.store("old", new Blob(["old"]), metadata);
    vi.setSystemTime(2_000);
    await firstTab.store("new", new Blob(["new"]), metadata);

    vi.setSystemTime(3_000);
    await expect(firstTab.deleteOlderThan(1_500)).resolves.toEqual({
      deleted: 1,
    });

    await secondTab.store("second-old", new Blob(["second old"]), metadata);

    vi.setSystemTime(3_000 + HEARTBEAT_MS - 1);
    await expect(secondTab.deleteOlderThan(1_500)).resolves.toEqual({
      deleted: 0,
    });
    await expect(secondTab.get("second-old")).resolves.toMatchObject({
      id: "second-old",
    });

    vi.setSystemTime(3_000 + HEARTBEAT_MS);
    await expect(secondTab.deleteOlderThan(1_500)).resolves.toEqual({
      deleted: 2,
    });
    await expect(secondTab.get("new")).resolves.toBeNull();
    await expect(secondTab.get("second-old")).resolves.toBeNull();
  });

  test("degrades to a no-op store when indexedDB.open throws", async () => {
    const openError = new Error("IDB disabled");
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw openError;
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createIndexedDBBlobStore();

    await expect(
      store.store("lost", new Blob(["lost"]), metadata, "scope-a"),
    ).resolves.toBe(false);
    await expect(store.get("lost")).resolves.toBeNull();
    await expect(store.listByScope("scope-a")).resolves.toEqual([]);
    await expect(store.deleteMany(["lost"])).resolves.toBeUndefined();
    await expect(store.refreshLastUsed(["lost"])).resolves.toBeUndefined();
    await expect(store.deleteOlderThan(1_000)).resolves.toEqual({
      deleted: 0,
    });
    await expect(store.store("still-lost", new Blob(["lost"]), metadata)).resolves.toBe(
      false,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "[hyperimage] IDB unavailable, originals will not persist:",
      openError,
    );
  });

  test("degrades to a no-op store when indexedDB.open fires onerror", async () => {
    const openError = new Error("open failed");
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      const request = { error: openError } as IDBOpenDBRequest;
      queueMicrotask(() => request.onerror?.(new Event("error")));
      return request;
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createIndexedDBBlobStore();

    await expect(
      store.store("lost", new Blob(["lost"]), metadata),
    ).resolves.toBe(false);
    await expect(store.get("lost")).resolves.toBeNull();
  });

  test("degrades to a no-op store when indexedDB.open stays blocked", async () => {
    vi.useFakeTimers();
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      const request = { error: null } as IDBOpenDBRequest;
      queueMicrotask(() => request.onblocked?.(new Event("blocked")));
      return request;
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createIndexedDBBlobStore();

    const stored = store.store("lost", new Blob(["lost"]), metadata);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(stored).resolves.toBe(false);
    await expect(store.deleteOlderThan(1_000)).resolves.toEqual({
      deleted: 0,
    });
  });
});
