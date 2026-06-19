// utils/helpers.js

export function timeAgo(ts) {
  // Safe extraction of milliseconds from any format
  const ms = typeof ts === "number" ? ts : (ts?.toMillis?.() ?? ts?.seconds * 1000 ?? Date.now());
  const now = Date.now();
  const s = Math.floor((now - ms) / 1000);

  if (s < 5) return "just now"; 
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export function truncate(text, max = 140) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// Confirm wrapper — returns a promise resolving to boolean
export function confirm(msg) {
  return Promise.resolve(window.confirm(msg));
}
