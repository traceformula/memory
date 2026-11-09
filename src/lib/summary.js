// Personal bests and labels for saved results.
import { formatMs as secs } from "./stats.js";

export function best(results) {
  const min = (xs) => (xs.length ? Math.min(...xs) : null);
  const max = (xs) => (xs.length ? Math.max(...xs) : null);
  return {
    run100: min(results.filter((r) => r.kind === "run" && r.src === "numbers" && r.complete && r.count === 100).map((r) => r.totalMs)),
    run52: min(results.filter((r) => r.kind === "run" && r.src === "cards" && r.complete && r.count === 52).map((r) => r.totalMs)),
    speedNumbers: max(results.filter((r) => r.kind === "numbers" && r.preset === "speed").map((r) => r.score)),
    leagueNumbers: max(results.filter((r) => r.kind === "numbers" && r.preset === "league").map((r) => r.score)),
    binary: max(results.filter((r) => r.kind === "numbers" && r.preset === "binary").map((r) => r.score)),
    deck: min(results.filter((r) => r.kind === "cards" && r.perfect).map((r) => r.memoMs)),
  };
}

const PRESET = { speed: "Speed", league: "Memory League style", binary: "Binary", custom: "Custom", practice: "Practice" };

export function describeResult(r) {
  switch (r.kind) {
    case "numbers": return { title: `${r.base === 2 ? "Binary" : "Numbers"} · ${PRESET[r.preset] || r.preset}`, value: `${r.score} points`, sub: `${r.correct}/${r.digits} correct, memorised in ${secs(r.memoMs)}` };
    case "cards": return { title: `Cards · ${PRESET[r.preset] || r.preset}`, value: r.perfect ? `${secs(r.memoMs)} perfect` : `${r.score}`, sub: `${r.correct}/52 in place, ${r.per} per stop` };
    case "run": return { title: `Speed run · ${r.src === "cards" ? "cards" : "numbers"}`, value: secs(r.totalMs), sub: `${r.count} images${r.misses ? `, ${r.misses} missed` : ""}${r.complete ? "" : ", stopped early"}` };
    case "review": return { title: `Spaced review · ${r.src}`, value: `${r.count} answers`, sub: r.again ? `${r.again} again` : "" };
    case "journey": return { title: `Journey · ${r.name}`, value: `${r.count - r.misses}/${r.count}`, sub: `${r.mode}, ${secs(r.totalMs)}` };
    default: return { title: r.kind, value: "", sub: "" };
  }
}

