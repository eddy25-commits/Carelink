const STORAGE_KEY = "carelink_offline_reports";

function readQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // If storage is full/unavailable, the queue simply won't persist across reloads.
  }
  try {
    window.dispatchEvent(new CustomEvent("carelink:queue-changed", { detail: { count: items.length } }));
  } catch {
    // CustomEvent unavailable in some non-browser test environments — safe to ignore.
  }
}

export function getQueuedReports() {
  return readQueue();
}

export function queueReport(payload) {
  const item = {
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    queuedAt: new Date().toISOString(),
  };
  const items = readQueue();
  items.push(item);
  writeQueue(items);
  return item;
}

export function removeQueuedReport(localId) {
  writeQueue(readQueue().filter((item) => item.localId !== localId));
}

export function queuedReportCount() {
  return readQueue().length;
}

/**
 * A failed fetch (offline, DNS failure, connection reset) throws a plain
 * TypeError before any HTTP response exists. A request that reached the
 * server and was rejected (validation, rate limit, etc) throws the app's
 * ApiError instead — that should surface to the user, not be queued.
 */
export function isNetworkError(err) {
  return typeof err === "object" && err !== null && err.name === "TypeError";
}

/**
 * Attempts to send every queued report via submitFn, in order, stopping at
 * the first failure (so a still-offline device doesn't burn through retries).
 * Returns how many were successfully sent and how many remain queued.
 */
export async function flushQueuedReports(submitFn) {
  const items = readQueue();
  let syncedCount = 0;

  for (const item of items) {
    try {
      await submitFn(item.payload);
      removeQueuedReport(item.localId);
      syncedCount += 1;
    } catch (err) {
      if (isNetworkError(err)) break; // still offline — stop and try again later
      removeQueuedReport(item.localId); // a real server-side rejection; don't retry forever
    }
  }

  return { syncedCount, remaining: queuedReportCount() };
}
