import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
} from "react";
import {
  defaultStore,
  blobToDataURL,
  type ImageMetadata,
} from "../src/storage";

const TWENTY_MINUTES = 20 * 60 * 1000;
const REFRESH_INTERVAL = 10_000;

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface ScopeImage {
  dataUrl: string;
  metadata: ImageMetadata;
  timestamp: number;
  lastUsed: number;
}

interface ScopeData {
  scopeId: string;
  images: ScopeImage[];
}

interface LogEntry {
  time: number;
  message: string;
}

function ScopeCard({
  label,
  images,
  isCurrent,
}: {
  label: string;
  images?: ScopeImage[];
  isCurrent: boolean;
}) {
  const hasImages = images && images.length > 0;
  const oldestLastUsed = hasImages
    ? Math.min(...images.map((i) => i.lastUsed))
    : 0;
  const now = Date.now();
  const age = now - oldestLastUsed;
  const ttl = TWENTY_MINUTES - age;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 4,
        padding: 8,
        marginBottom: 12,
        background: isCurrent ? "transparent" : "#f5f5f5",
      }}
    >
      <h4 style={{ margin: "0 0 4px", color: "#555" }}>{label}</h4>
      {hasImages ? (
        <>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#999" }}>
            {formatDuration(age)} ago
            {!isCurrent && ` · last used ${formatTime(oldestLastUsed)}`}
            {!isCurrent && ttl > 0 && ` · cleanup in ${formatDuration(ttl)}`}
            {!isCurrent && ttl <= 0 && " · due for cleanup"}
          </p>
          {images.map(({ dataUrl, metadata }, i) => (
            <div key={i}>
              <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                {metadata.width}x{metadata.height}
              </p>
              <img
                src={dataUrl}
                style={{ maxWidth: "100%", border: "2px solid green" }}
              />
            </div>
          ))}
        </>
      ) : (
        <p style={{ color: "#999", margin: 0 }}>No images yet</p>
      )}
    </div>
  );
}

function EventLog({ entries }: { entries: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        maxHeight: 300,
        overflowY: "auto",
      }}
    >
      {entries.length === 0 ? (
        <span style={{ color: "#999" }}>No events yet</span>
      ) : (
        entries.map((e, i) => (
          <div key={i}>
            <span style={{ color: "#999" }}>{formatTime(e.time)}</span>{" "}
            {e.message}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

export function StorageDebugPanel({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [scopes, setScopes] = useState<ScopeData[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentScopeId, setCurrentScopeId] = useState<string | undefined>();
  const knownIdsRef = useRef<Set<string>>(new Set());

  const addLog = useCallback((message: string) => {
    setLog((prev) => [...prev, { time: Date.now(), message }]);
  }, []);

  const refresh = useCallback(async () => {
    const ids = await defaultStore.listIds();
    const currentIds = new Set(ids);

    const known = knownIdsRef.current;
    const added = ids.filter((id) => !known.has(id));
    const removed = [...known].filter((id) => !currentIds.has(id));
    if (added.length > 0) addLog(`+${added.length} image(s) stored`);
    if (removed.length > 0) addLog(`-${removed.length} image(s) removed`);
    knownIdsRef.current = currentIds;

    const byScope = new Map<string, ScopeImage[]>();
    for (const id of ids) {
      const stored = await defaultStore.get(id);
      if (stored) {
        const scope = stored.scopeId ?? "unknown";
        const dataUrl = await blobToDataURL(stored.originalBlob);
        if (!byScope.has(scope)) byScope.set(scope, []);
        byScope.get(scope)!.push({
          dataUrl,
          metadata: stored.metadata,
          timestamp: stored.timestamp,
          lastUsed: stored.lastUsed,
        });
      }
    }

    const sorted = [...byScope.entries()]
      .sort(
        ([, a], [, b]) =>
          Math.max(...b.map((i) => i.timestamp)) -
          Math.max(...a.map((i) => i.timestamp)),
      )
      .map(([scopeId, images]) => ({
        scopeId,
        images: images.sort((a, b) => a.timestamp - b.timestamp),
      }));

    setScopes(sorted);
    return sorted;
  }, [addLog]);

  useEffect(() => {
    const check = () => {
      const id =
        document
          .querySelector("[data-astrolb-scope-id]")
          ?.getAttribute("data-astrolb-scope-id") ?? undefined;
      if (id) setCurrentScopeId(id);
    };
    check();
    const timeout = setTimeout(check, 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const pruned = await defaultStore.deleteOlderThan(TWENTY_MINUTES);
      if (cancelled) return;
      if (pruned.deleted > 0) {
        addLog(`Pruned ${pruned.deleted} stale image(s)`);
      }

      knownIdsRef.current = new Set(await defaultStore.listIds());
      if (cancelled) return;

      const result = await refresh();
      if (cancelled) return;

      const imageCount = result.reduce((n, s) => n + s.images.length, 0);
      if (imageCount > 0) {
        addLog(
          `Init: ${imageCount} image(s) across ${result.length} session(s)`,
        );
      } else {
        addLog("Init: store is empty");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh, addLog]);

  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL);

    // Refresh shortly after paste/drop so the store write has time to complete.
    const container = containerRef.current;
    const delayedRefresh = () => setTimeout(refresh, 500);
    container?.addEventListener("paste", delayedRefresh);
    container?.addEventListener("drop", delayedRefresh);

    return () => {
      clearInterval(interval);
      container?.removeEventListener("paste", delayedRefresh);
      container?.removeEventListener("drop", delayedRefresh);
    };
  }, [refresh, containerRef]);

  const currentScope = scopes.find((s) => s.scopeId === currentScopeId);
  const oldScopes = scopes.filter((s) => s.scopeId !== currentScopeId);
  const now = Date.now();
  const expiredCount = scopes.reduce(
    (n, s) =>
      n + s.images.filter((i) => now - i.lastUsed >= TWENTY_MINUTES).length,
    0,
  );

  return (
    <div style={{ marginTop: 20, padding: 10, borderTop: "1px solid #ccc" }}>
      <button
        onClick={async () => {
          await defaultStore.clear();
          knownIdsRef.current = new Set();
          addLog("Cleared all originals");
          await refresh();
        }}
        style={{
          padding: "8px 16px",
          cursor: "pointer",
          background: "#fee",
          borderColor: "#c00",
          marginBottom: 10,
        }}
      >
        Clear All Originals
      </button>
      <button
        onClick={async () => {
          const result = await defaultStore.deleteOlderThan(TWENTY_MINUTES);
          if (result.deleted > 0) {
            knownIdsRef.current = new Set(await defaultStore.listIds());
            addLog(`Cleared ${result.deleted} expired image(s)`);
          } else {
            addLog("No expired images to clear");
          }
          await refresh();
        }}
        style={{
          padding: "8px 16px",
          cursor: "pointer",
          background: "#fef3cd",
          borderColor: "#856404",
          marginBottom: 10,
          marginLeft: 8,
        }}
      >
        Clear Expired{expiredCount > 0 ? ` (${expiredCount})` : ""}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <ScopeCard
          label="Current session"
          images={currentScope?.images}
          isCurrent
        />

        <div>
          <h4 style={{ margin: "0 0 8px", color: "#555" }}>Event log</h4>
          <EventLog entries={log} />
        </div>
      </div>

      {oldScopes.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 8px", color: "#999" }}>Old sessions</h4>
          {oldScopes.map((s) => (
            <ScopeCard
              key={s.scopeId}
              label={s.scopeId}
              images={s.images}
              isCurrent={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StorageDebugWrapper({ Story }: { Story: ComponentType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef}>
      <Story />
      <StorageDebugPanel containerRef={containerRef} />
    </div>
  );
}

export function withStorageDebugPanel(Story: ComponentType) {
  return <StorageDebugWrapper Story={Story} />;
}
