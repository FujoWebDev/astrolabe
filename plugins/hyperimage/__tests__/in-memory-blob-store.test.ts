import { describe, expect, test } from "vitest";

import { createInMemoryBlobStoreWithClock } from "../src/storage/in-memory-store";

const metadata = {
  width: 640,
  height: 480,
  fileName: "sample.png",
  fileSize: 12,
  mimeType: "image/png",
};

describe("createInMemoryBlobStore", () => {
  test("round-trips stored blobs by id", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
    const blob = new Blob(["image bytes"], { type: "image/png" });

    await expect(store.store("image-1", blob, metadata, "scope-a")).resolves.toBe(
      true,
    );

    await expect(store.get("image-1")).resolves.toEqual({
      id: "image-1",
      blob,
      metadata,
      scopeId: "scope-a",
    });
  });

  test("deletes many blobs by id", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
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
    const store = createInMemoryBlobStoreWithClock(() => 1_000);

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
    let time = 1_000;
    const store = createInMemoryBlobStoreWithClock(() => time);

    await store.store("stale", new Blob(["stale"]), metadata);
    await store.store("fresh", new Blob(["fresh"]), metadata);

    time = 2_000;
    await store.refreshLastUsed(["fresh"]);

    time = 2_500;
    await expect(store.deleteOlderThan(1_000)).resolves.toEqual({ deleted: 1 });
    await expect(store.get("stale")).resolves.toBeNull();
    await expect(store.get("fresh")).resolves.toMatchObject({ id: "fresh" });
  });

  test("deletes only blobs older than the max age", async () => {
    let time = 1_000;
    const store = createInMemoryBlobStoreWithClock(() => time);

    await store.store("old", new Blob(["old"]), metadata);
    time = 1_600;
    await store.store("new", new Blob(["new"]), metadata);

    time = 2_100;
    await expect(store.deleteOlderThan(800)).resolves.toEqual({ deleted: 1 });
    await expect(store.get("old")).resolves.toBeNull();
    await expect(store.get("new")).resolves.toMatchObject({ id: "new" });
  });
});
