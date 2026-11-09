// Shared pieces of the competition events.

export const CAUSES = [
  ["image", "Image was weak or slow"],
  ["stop", "Lost my place in the journey"],
  ["link", "Image didn't stick to the stop"],
  ["order", "Images in the wrong order"],
  ["focus", "Rushed or lost focus"],
  ["slip", "Knew it, entered it wrong"],
];
export const causeLabel = (c) => CAUSES.find(([k]) => k === c)?.[1] || c;

// Stops of the chosen journeys, one after another.
export function chainLoci(journeys, ids) {
  return ids.flatMap((id) => {
    const j = journeys.find((x) => x.id === id);
    return j ? j.loci.map((l, i) => ({ journey: j.name, name: l.name, n: i + 1 })) : [];
  });
}

// Split a digit sheet into the groups you place at one stop each. Groups never cross a row.
export function digitGroups(total, rowLen, size) {
  const out = [];
  for (let r = 0; r * rowLen < total; r++) {
    const end = Math.min(total, (r + 1) * rowLen);
    for (let s = r * rowLen; s < end; s += size) out.push({ row: r, start: s, end: Math.min(end, s + size) });
  }
  return out;
}

// Group mistakes by stop: [{ group, indexes: [...] }]
export function mistakesByGroup(groupOf, mistakes) {
  const map = new Map();
  for (const i of mistakes) {
    const g = groupOf(i);
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(i);
  }
  return [...map].map(([group, indexes]) => ({ group, indexes }));
}

export const NUMBER_PRESETS = {
  speed: { label: "Speed Numbers", note: "World Championship rules: 5 minutes to memorise, 15 to recall, rows of 40.", base: 10, rowLen: 40, memoSec: 300, recallSec: 900, scoring: "rows", rows: 10, group: 4 },
  league: { label: "Memory League style", note: "80 digits, up to 1 minute to memorise, 4 to recall. One point per correct digit; stopping early is faster.", base: 10, rowLen: 40, memoSec: 60, recallSec: 240, scoring: "count", rows: 2, group: 4 },
  binary: { label: "Binary", note: "5-minute binary (IAM): rows of 30, 15 minutes to recall. Read 3 bits as one digit (101 = 5), so 6 bits are one image.", base: 2, rowLen: 30, memoSec: 300, recallSec: 900, scoring: "rows", rows: 10, group: 6 },
  custom: { label: "Custom", note: "Your own amount and times, scored like Speed Numbers.", base: 10, rowLen: 40, memoSec: 120, recallSec: 300, scoring: "rows", rows: 3, group: 4 },
};

export const CARD_PRESETS = {
  speed: { label: "Speed Cards", note: "World Championship rules: up to 5 minutes to memorise one deck, 5 to recall. A perfect deck is ranked by time; otherwise only the cards before the first mistake count.", memoSec: 300, recallSec: 300, scoring: "speed" },
  league: { label: "Memory League style", note: "Up to 1 minute to memorise, 4 to recall. One point per card in the right place.", memoSec: 60, recallSec: 240, scoring: "count" },
  practice: { label: "Practice", note: "Up to 15 minutes to memorise, scored like Speed Cards. Good while you are still learning.", memoSec: 900, recallSec: 600, scoring: "speed" },
};
