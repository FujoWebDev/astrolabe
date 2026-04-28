import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";

import type { ImageBlobStore } from "./blob-store";

export const HEARTBEAT_MS = 5 * 60 * 1_000;
export const TTL_MS = 20 * 60 * 1_000;

/**
 * Wiring for `HyperimageLifecycle`.
 *
 * `storage`, `scopeId`, and `nodeName` are required. The rest are seams for
 * tests: pass fake clocks, timers, or visibility adapters to drive the
 * lifecycle deterministically.
 */
export interface LifecycleOpts {
  storage: ImageBlobStore;
  scopeId: string;
  nodeName: string;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
  visibility?: { addListener(cb: () => void): () => void };
  reportError?: (err: unknown, where: string) => void;
}

function createVisibilityAdapter(): { addListener(cb: () => void): () => void } {
  return {
    addListener(cb) {
      if (typeof document === "undefined") {
        return () => {};
      }

      const listener = () => {
        if (document.visibilityState === "visible") {
          cb();
        }
      };

      document.addEventListener("visibilitychange", listener);
      return () => document.removeEventListener("visibilitychange", listener);
    },
  };
}

function defaultReportError(err: unknown, where: string): void {
  console.warn(`[hyperimage] lifecycle ${where} failed:`, err);
}

/**
 * Keeps `storage` in sync with the image nodes currently in the document.
 *
 * The lifecycle owns four jobs:
 *
 * - On attach, it reconciles: orphans (in storage but not in the doc) get
 *   deleted, and preview nodes whose original is missing get flagged with
 *   `originalMissing: true`.
 * - On every doc change, ids that disappeared from the doc get deleted from
 *   storage so we do not leak originals for removed nodes.
 * - On a heartbeat (and on tab focus), it refreshes `lastUsed` for every
 *   tracked id so the TTL sweep does not reap originals while their nodes
 *   are still on screen. The heartbeat also syncs `originalMissing` so previews
 *   reflect originals disappearing or coming back while the editor is open.
 * - On editor destroy, it tears down the heartbeat and visibility listener.
 *
 * Invariant: `trackedIds` mirrors the set of image-node ids in the current
 * doc. Deletion is driven by what falls out of that set between transactions.
 */
export class HyperimageLifecycle {
  private readonly storage: ImageBlobStore;
  private readonly scopeId: string;
  private readonly nodeName: string;
  private readonly setIntervalFn: typeof globalThis.setInterval;
  private readonly clearIntervalFn: typeof globalThis.clearInterval;
  private readonly visibility: { addListener(cb: () => void): () => void };
  private readonly reportError: (err: unknown, where: string) => void;
  private trackedIds = new Set<string>();
  private heartbeat: ReturnType<typeof globalThis.setInterval> | null = null;
  private removeVisibilityListener: (() => void) | null = null;
  private editor: Editor | null = null;

  constructor(opts: LifecycleOpts) {
    this.storage = opts.storage;
    this.scopeId = opts.scopeId;
    this.nodeName = opts.nodeName;
    this.setIntervalFn = opts.setInterval ?? globalThis.setInterval;
    this.clearIntervalFn = opts.clearInterval ?? globalThis.clearInterval;
    this.visibility = opts.visibility ?? createVisibilityAdapter();
    this.reportError = opts.reportError ?? defaultReportError;
  }

  /**
   * Wires the lifecycle to an editor: reconciles storage against the current
   * doc, starts the heartbeat, and listens for tab visibility changes. Safe
   * to call once per editor; the destroy listener cleans up timers when the
   * editor goes away.
   */
  async attach(editor: Editor): Promise<void> {
    this.editor = editor;
    editor.on("destroy", () => this.destroy());
    if (editor.isDestroyed) return;

    const activeIds = this.collectIds(editor.state.doc);
    this.trackedIds = new Set(activeIds);

    await this.reconcile(editor, activeIds);
    if (editor.isDestroyed) return;
    await this.run("refresh", () => this.storage.refreshLastUsed(activeIds));
    if (editor.isDestroyed) return;
    await this.run("ttl", () => this.storage.deleteOlderThan(TTL_MS));
    if (editor.isDestroyed) return;

    this.heartbeat = this.setIntervalFn(() => this.onHeartbeat(), HEARTBEAT_MS);
    this.removeVisibilityListener = this.visibility.addListener(() => {
      void this.run("visibility", () =>
        this.storage.refreshLastUsed([...this.trackedIds]),
      );
    });
  }

  /**
   * Called from the extension's `onTransaction`. Diffs the doc's image ids
   * against `trackedIds`, deletes the originals for any id that disappeared,
   * and updates `trackedIds` to match the new doc.
   */
  onDocChange(doc: PMNode): void {
    const currentIds = new Set(this.collectIds(doc));
    const deletedIds = [...this.trackedIds].filter((id) => !currentIds.has(id));

    if (deletedIds.length > 0) {
      void this.run("delete", () => this.storage.deleteMany(deletedIds));
    }

    this.trackedIds = currentIds;
  }

  private destroy(): void {
    if (this.heartbeat !== null) {
      this.clearIntervalFn(this.heartbeat);
      this.heartbeat = null;
    }
    this.removeVisibilityListener?.();
    this.removeVisibilityListener = null;
  }

  private async onHeartbeat(): Promise<void> {
    if (!this.editor || this.editor.isDestroyed) return;
    const ids = [...this.trackedIds];
    await this.run("heartbeat", () => this.storage.refreshLastUsed(ids));

    if (this.editor && !this.editor.isDestroyed) {
      const storedIds = await this.safeListByScope("heartbeat");
      if (storedIds && this.editor && !this.editor.isDestroyed) {
        this.syncMissingOriginals(this.editor, new Set(storedIds));
      }
    }
  }

  private async reconcile(editor: Editor, activeIds: string[]): Promise<void> {
    const storedIds = await this.safeListByScope("reconcile");
    if (!storedIds) return;

    const activeSet = new Set(activeIds);
    const orphanIds = storedIds.filter((id) => !activeSet.has(id));

    if (orphanIds.length > 0) {
      await this.run("cleanup", () => this.storage.deleteMany(orphanIds));
    }

    this.syncMissingOriginals(editor, new Set(storedIds));
  }

  private collectIds(doc: PMNode): string[] {
    const ids: string[] = [];
    doc.descendants((node) => {
      if (node.type.name === this.nodeName && node.attrs.id) {
        ids.push(node.attrs.id);
      }
    });
    return ids;
  }

  private syncMissingOriginals(editor: Editor, storedSet: Set<string>): void {
    this.updateOriginalMissing(editor, storedSet);
  }

  private updateOriginalMissing(
    editor: Editor,
    storedSet: Set<string>,
  ): void {
    if (editor.isDestroyed) return;
    let tr = editor.state.tr;
    let changed = false;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== this.nodeName) return;

      const id = node.attrs.id;
      if (!id || !node.attrs.isPreview) return;

      const shouldBeMissing = !storedSet.has(id);
      if (node.attrs.originalMissing !== shouldBeMissing) {
        tr = tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          originalMissing: shouldBeMissing,
        });
        changed = true;
      }
    });

    if (changed) {
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    }
  }

  private async safeListByScope(where: string): Promise<string[] | null> {
    try {
      return await this.storage.listByScope(this.scopeId);
    } catch (error) {
      this.reportError(error, where);
      return null;
    }
  }

  private async run<T>(where: string, action: () => Promise<T>): Promise<T | null> {
    try {
      return await action();
    } catch (error) {
      this.reportError(error, where);
      return null;
    }
  }
}
