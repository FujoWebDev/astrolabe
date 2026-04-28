import "fake-indexeddb/auto";

import { Schema } from "@tiptap/pm/model";
import { EditorState, type Transaction } from "@tiptap/pm/state";
import { describe, expect, test, vi } from "vitest";

import {
  HyperimageLifecycle,
  TTL_MS,
} from "../src/storage/lifecycle";
import { createInMemoryBlobStoreWithClock } from "../src/storage/in-memory-store";
import { IndexedDBBlobStore } from "../src/storage/indexed-db-store";
import type { ImageBlobStore } from "../src/storage/blob-store";

const metadata = { width: 100, height: 100, mimeType: "image/png" };

const schema = new Schema({
  nodes: {
    doc: { content: "block*" },
    paragraph: { content: "inline*", group: "block" },
    text: { group: "inline" },
    hyperimage: {
      group: "block",
      atom: true,
      attrs: {
        id: { default: null },
        src: { default: null },
        isPreview: { default: false },
        originalMissing: { default: false },
      },
      toDOM: () => ["img", 0],
      parseDOM: [{ tag: "img" }],
    },
  },
});

function hyperimage(
  id: string,
  attrs: Record<string, unknown> = {},
) {
  return schema.nodes.hyperimage.create({
    id,
    src: `data:${id}`,
    ...attrs,
  });
}

function createEditor(doc = schema.node("doc", null, [])) {
  let state = EditorState.create({ schema, doc });
  const destroyHandlers: Array<() => void> = [];

  return {
    get state() {
      return state;
    },
    view: {
      dispatch(transaction: Transaction) {
        state = state.apply(transaction);
      },
    },
    on(event: string, cb: () => void) {
      if (event === "destroy") {
        destroyHandlers.push(cb);
      }
    },
    destroy() {
      for (const handler of destroyHandlers) {
        handler();
      }
    },
  };
}

function createRecordingStore(store: ImageBlobStore) {
  const calls = {
    deleteMany: [] as readonly string[][],
    refreshLastUsed: [] as readonly string[][],
    deleteOlderThan: [] as number[],
    deleteOlderThanResults: [] as Array<{ deleted: number }>,
    listByScope: [] as string[],
  };

  return {
    calls,
    store: {
      ...store,
      async deleteMany(ids: readonly string[]) {
        calls.deleteMany.push([...ids]);
        return store.deleteMany(ids);
      },
      async refreshLastUsed(ids: readonly string[]) {
        calls.refreshLastUsed.push([...ids]);
        return store.refreshLastUsed(ids);
      },
      async deleteOlderThan(maxAgeMs: number) {
        calls.deleteOlderThan.push(maxAgeMs);
        const result = await store.deleteOlderThan(maxAgeMs);
        calls.deleteOlderThanResults.push(result);
        return result;
      },
      async listByScope(scopeId: string) {
        calls.listByScope.push(scopeId);
        return store.listByScope(scopeId);
      },
    } satisfies ImageBlobStore,
  };
}

function createIntervalHarness() {
  const callbacks: Array<() => void> = [];
  return {
    callbacks,
    setInterval: ((cb: () => void) => {
      callbacks.push(cb);
      return callbacks.length;
    }) as typeof globalThis.setInterval,
    clearInterval: vi.fn() as unknown as typeof globalThis.clearInterval,
  };
}

describe("HyperimageLifecycle", () => {
  test("mount flags preview nodes whose originals are missing", async () => {
    const baseStore = createInMemoryBlobStoreWithClock(() => 1_000);
    await baseStore.store("kept", new Blob(["kept"]), metadata, "doc-1");
    const editor = createEditor(
      schema.node("doc", null, [
        hyperimage("kept", { isPreview: true }),
        hyperimage("missing", { isPreview: true }),
      ]),
    );

    await new HyperimageLifecycle({
      storage: baseStore,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(editor as any);

    expect(editor.state.doc.child(0).attrs.originalMissing).toBe(false);
    expect(editor.state.doc.child(1).attrs.originalMissing).toBe(true);
  });

  test("mount does not flag non-preview nodes whose originals are missing", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
    const editor = createEditor(
      schema.node("doc", null, [hyperimage("missing", { isPreview: false })]),
    );

    await new HyperimageLifecycle({
      storage: store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(editor as any);

    expect(editor.state.doc.child(0).attrs.originalMissing).toBe(false);
  });

  test("mount leaves originalMissing unchanged when storage listing is unavailable", async () => {
    const reportError = vi.fn();
    const store = {
      async store() {
        return false;
      },
      async get() {
        return null;
      },
      async deleteMany() {
        return;
      },
      async listByScope() {
        throw new Error("unavailable");
      },
      async refreshLastUsed() {},
      async deleteOlderThan() {
        return { deleted: 0 };
      },
    } satisfies ImageBlobStore;
    const editor = createEditor(
      schema.node("doc", null, [hyperimage("unknown", { isPreview: true })]),
    );

    await new HyperimageLifecycle({
      storage: store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
      reportError,
    }).attach(editor as any);

    expect(editor.state.doc.child(0).attrs.originalMissing).toBe(false);
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), "reconcile");
  });

  test("reconciles orphans, refreshes active ids, and sweeps TTL on mount", async () => {
    const baseStore = createInMemoryBlobStoreWithClock(() => 1_000);
    await baseStore.store("kept", new Blob(["kept"]), metadata, "doc-1");
    await baseStore.store("orphan", new Blob(["orphan"]), metadata, "doc-1");
    const { calls, store } = createRecordingStore(baseStore);
    const editor = createEditor(schema.node("doc", null, [hyperimage("kept")]));

    await new HyperimageLifecycle({
      storage: store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(editor as any);

    expect(calls.deleteMany).toEqual([["orphan"]]);
    expect(calls.refreshLastUsed).toEqual([["kept"]]);
    expect(calls.deleteOlderThan).toEqual([TTL_MS]);
    await expect(baseStore.get("orphan")).resolves.toBeNull();
  });

  test("heartbeat refreshes tracked ids", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
    const { calls, store: recordingStore } = createRecordingStore(store);
    const intervals = createIntervalHarness();
    const editor = createEditor(
      schema.node("doc", null, [hyperimage("kept", { isPreview: true })]),
    );

    await new HyperimageLifecycle({
      storage: recordingStore,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: intervals.setInterval,
      clearInterval: intervals.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(editor as any);

    await intervals.callbacks[0]();

    expect(calls.refreshLastUsed).toEqual([["kept"], ["kept"]]);
  });

  test("heartbeat flags runtime loss and clears originalMissing when restored", async () => {
    const baseStore = createInMemoryBlobStoreWithClock(() => 1_000);
    await baseStore.store("restored", new Blob(["restored"]), metadata, "doc-1");
    await baseStore.store("lost", new Blob(["lost"]), metadata, "doc-1");
    const { store } = createRecordingStore(baseStore);
    const intervals = createIntervalHarness();
    const editor = createEditor(
      schema.node("doc", null, [
        hyperimage("restored", { isPreview: true, originalMissing: true }),
        hyperimage("lost", { isPreview: true }),
      ]),
    );

    await new HyperimageLifecycle({
      storage: store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: intervals.setInterval,
      clearInterval: intervals.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(editor as any);
    await baseStore.deleteMany(["lost"]);

    await intervals.callbacks[0]();

    expect(editor.state.doc.child(0).attrs.originalMissing).toBe(false);
    expect(editor.state.doc.child(1).attrs.originalMissing).toBe(true);
  });

  test("visibility catch-up refreshes tracked ids", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
    const { calls, store: recordingStore } = createRecordingStore(store);
    let visibilityCallback: (() => void) | null = null;
    const editor = createEditor(schema.node("doc", null, [hyperimage("kept")]));

    await new HyperimageLifecycle({
      storage: recordingStore,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: {
        addListener(cb) {
          visibilityCallback = cb;
          return () => {};
        },
      },
    }).attach(editor as any);

    visibilityCallback?.();

    expect(calls.refreshLastUsed).toEqual([["kept"], ["kept"]]);
  });

  test("onDocChange deletes ids removed from the document", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
    const { calls, store: recordingStore } = createRecordingStore(store);
    const lifecycle = new HyperimageLifecycle({
      storage: recordingStore,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
    });
    const editor = createEditor(
      schema.node("doc", null, [hyperimage("kept"), hyperimage("removed")]),
    );

    await lifecycle.attach(editor as any);
    lifecycle.onDocChange(schema.node("doc", null, [hyperimage("kept")]));

    expect(calls.deleteMany).toEqual([["removed"]]);
  });

  test("destroy clears heartbeat and visibility listener", async () => {
    const store = createInMemoryBlobStoreWithClock(() => 1_000);
    const intervals = createIntervalHarness();
    const removeVisibility = vi.fn();
    const editor = createEditor(schema.node("doc", null, [hyperimage("kept")]));

    await new HyperimageLifecycle({
      storage: store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: intervals.setInterval,
      clearInterval: intervals.clearInterval,
      visibility: { addListener: () => removeVisibility },
    }).attach(editor as any);

    editor.destroy();

    expect(intervals.clearInterval).toHaveBeenCalledWith(1);
    expect(removeVisibility).toHaveBeenCalledTimes(1);
  });

  test("mount TTL sweep is debounced across IndexedDB-backed lifecycles", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000);
    await new IndexedDBBlobStore().clear();
    const firstStore = new IndexedDBBlobStore();
    const secondStore = new IndexedDBBlobStore();
    const first = createRecordingStore(firstStore);
    const second = createRecordingStore(secondStore);

    await firstStore.store("old", new Blob(["old"]), metadata, "abandoned");
    vi.setSystemTime(2_000);
    await firstStore.store("new", new Blob(["new"]), metadata, "abandoned");

    vi.setSystemTime(TTL_MS + 3_000);
    await new HyperimageLifecycle({
      storage: first.store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(createEditor() as any);
    await new HyperimageLifecycle({
      storage: second.store,
      scopeId: "doc-1",
      nodeName: "hyperimage",
      setInterval: (() => 1) as typeof globalThis.setInterval,
      clearInterval: (() => {}) as typeof globalThis.clearInterval,
      visibility: { addListener: () => () => {} },
    }).attach(createEditor() as any);

    expect(first.calls.deleteOlderThan).toEqual([TTL_MS]);
    expect(second.calls.deleteOlderThan).toEqual([TTL_MS]);
    expect(first.calls.deleteOlderThanResults).toEqual([{ deleted: 2 }]);
    expect(second.calls.deleteOlderThanResults).toEqual([{ deleted: 0 }]);
    await expect(firstStore.listAll()).resolves.toEqual([]);
  });
});
