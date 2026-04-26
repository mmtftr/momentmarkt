import { useEffect, useRef, useState } from "react";

type Status = "connecting" | "online" | "degraded" | "offline";

const POLL_INTERVAL_MS = 5000;
// If we go this long without a successful response, drop from online -> degraded.
const DEGRADED_AFTER_MS = 12_000;
// If we go this long without a successful response, drop to offline.
const OFFLINE_AFTER_MS = 25_000;

function relativeAgo(ms: number | null): string {
  if (ms == null) return "no contact";
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 2) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function statusLabel(status: Status): string {
  switch (status) {
    case "connecting":
      return "Connecting";
    case "online":
      return "Live";
    case "degraded":
      return "Slow";
    case "offline":
      return "Offline";
  }
}

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("connecting");
  const [lastSuccess, setLastSuccess] = useState<number | null>(null);
  const [pollTick, setPollTick] = useState(0);
  const [, setNow] = useState(Date.now());
  const lastSuccessRef = useRef<number | null>(null);

  // Health poll loop.
  useEffect(() => {
    let cancelled = false;
    const baseUrl = import.meta.env.VITE_API_URL || "https://peaktwilight-momentmarkt-api.hf.space";

    const downgrade = () => {
      const last = lastSuccessRef.current;
      if (last == null) {
        setStatus("offline");
        return;
      }
      const sinceLast = Date.now() - last;
      if (sinceLast >= OFFLINE_AFTER_MS) setStatus("offline");
      else if (sinceLast >= DEGRADED_AFTER_MS) setStatus("degraded");
    };

    const fetchHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const r = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (cancelled) return;
        if (r.ok) {
          const ts = Date.now();
          lastSuccessRef.current = ts;
          setLastSuccess(ts);
          setStatus("online");
          setPollTick((tick) => tick + 1);
          return;
        }
        // Non-2xx response — backend reachable but unhealthy.
        downgrade();
      } catch {
        if (cancelled) return;
        downgrade();
      }
    };

    fetchHealth();
    const id = setInterval(fetchHealth, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Tick clock so the "x ago" label refreshes between polls.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = lastSuccess == null ? null : Date.now() - lastSuccess;
  const label = statusLabel(status);

  return (
    <div
      className={`api-status api-status-${status}`}
      role="status"
      aria-live="polite"
      title={`Backend health · last contact ${relativeAgo(ago)}`}
    >
      <span className="api-status-dot" key={pollTick} />
      <span className="api-status-label">{label}</span>
      <span className="api-status-meta">{relativeAgo(ago)}</span>
    </div>
  );
}
