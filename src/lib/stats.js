// Recall speed for each code, and day-based summaries of practice.

const KEEP = 12;

// Add one timed answer. `ms` is how long the image took to come; a miss is stored as null.
export function addTime(entry = {}, ms, now = new Date()) {
  const times = [...(entry.times || []), ms == null ? null : Math.round(ms)].slice(-KEEP);
  return { ...entry, times, seen: (entry.seen || 0) + 1, misses: (entry.misses || 0) + (ms == null ? 1 : 0), last: now.toISOString() };
}

// Median of the last five answers. A recent miss counts as slow (5 s) so it stays on the list.
export function recentMs(entry) {
  const t = (entry?.times || []).slice(-5).map((x) => (x == null ? 5000 : x));
  if (!t.length) return null;
  const s = [...t].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Consecutive days with any practice, ending today, or yesterday if today has none yet.
export function streak(results, now = new Date()) {
  const days = new Set(results.map((r) => dayKey(new Date(r.date))));
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const doneToday = (results, kinds, now = new Date()) =>
  results.some((r) => kinds.includes(r.kind) && dayKey(new Date(r.date)) === dayKey(now));

export function formatMs(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return Math.round(ms) + " ms";
  if (ms < 60000) return (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + " s";
  const s = Math.round(ms / 1000);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

export const formatClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};
