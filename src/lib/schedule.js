// Spaced repetition scheduling, a variant of SM-2 (the algorithm Anki grew from).
// Pure functions only, so it can be tested without a browser or a database.
//
// Cards written by earlier versions of this app only have { interval, ease, due }.
// Every read goes through normalize(), so those cards keep working as they are.

export const GRADES = ["again", "hard", "good", "easy"];
const MIN_EASE = 1.3, MAX_EASE = 3.5, MAX_INTERVAL = 36500, RELEARN_MINUTES = 10;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const finite = (v, d) => (typeof v === "number" && Number.isFinite(v) ? v : d);

export function normalize(card) {
  const interval = Math.max(1, finite(card.interval, 1));
  return {
    interval,
    ease: clamp(finite(card.ease, 2.5), MIN_EASE, MAX_EASE),
    // Older cards have no review count. A gap over a day means they were reviewed before.
    reps: Math.max(0, finite(card.reps, interval > 1 ? 2 : 0)),
    lapses: Math.max(0, finite(card.lapses, 0)),
  };
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };

// The new scheduling fields for a card after answering with a grade.
export function schedule(card, grade, now = new Date()) {
  if (!GRADES.includes(grade)) throw new Error("Unknown grade: " + grade);
  const c = normalize(card);
  let { interval, ease, reps, lapses } = c, due;

  if (grade === "again") {
    if (reps > 0) lapses += 1;
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
    reps = 0; interval = 1;
    due = new Date(now.getTime() + RELEARN_MINUTES * 60000);
  } else {
    if (reps === 0) interval = { hard: 1, good: 1, easy: 4 }[grade];
    else if (reps === 1) interval = { hard: 3, good: 6, easy: 8 }[grade];
    else {
      const old = c.interval;
      const good = Math.max(old + 1, Math.round(old * ease));
      if (grade === "hard") interval = Math.max(old + 1, Math.round(old * 1.2));
      else if (grade === "good") interval = good;
      else interval = Math.max(good + 1, Math.round(old * ease * 1.3));
    }
    if (grade === "hard") ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
    if (grade === "easy") ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
    reps += 1;
    interval = Math.min(interval, MAX_INTERVAL);
    // Due from the start of that day, so a card can be reviewed any time on its day.
    due = addDays(now, interval);
  }
  return { interval, ease: Math.round(ease * 1000) / 1000, reps, lapses, due: due.toISOString(), lastReview: now.toISOString() };
}

export function preview(card, grade, now = new Date()) {
  if (grade === "again") return RELEARN_MINUTES + " min";
  return formatInterval(schedule(card, grade, now).interval);
}
export function formatInterval(days) {
  if (days < 31) return days + (days === 1 ? " day" : " days");
  if (days < 365) return Math.round(days / 30.4) + " mo";
  return (Math.round((days / 365) * 10) / 10) + " yr";
}

export const isDue = (card, now = new Date()) => { const t = new Date(card.due).getTime(); return Number.isNaN(t) || t <= now.getTime(); };
export const isNew = (card) => !card.lastReview && normalize(card).reps === 0;

// Oldest overdue first, then new cards in the order they were added.
export function buildQueue(cards, now = new Date()) {
  const due = cards.filter((c) => isDue(c, now));
  const time = (c) => new Date(c.due).getTime() || 0;
  return [...due.filter((c) => !isNew(c)).sort((a, b) => time(a) - time(b)), ...due.filter(isNew)];
}

// Cards coming due on each of the next `days` days. Index 0 includes anything overdue.
export function forecast(cards, days = 14, now = new Date()) {
  const out = new Array(days).fill(0), start = startOfDay(now).getTime();
  for (const c of cards) {
    const t = new Date(c.due).getTime(), i = Number.isNaN(t) ? 0 : Math.floor((t - start) / 86400000);
    if (i < days) out[Math.max(0, i)]++;
  }
  return out;
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Consecutive days with reviews, ending today, or yesterday if today has none yet.
export function streak(stats, now = new Date()) {
  const has = (d) => (stats[dayKey(d)]?.count || 0) > 0;
  let d = startOfDay(now);
  if (!has(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (has(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
