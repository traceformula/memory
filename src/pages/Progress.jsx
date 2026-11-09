import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp, statKey } from "../store/context";
import { KEYS, describe } from "../lib/codes";
import { SUITS, VALUES, cardLabel } from "../lib/cards";
import { causeLabel } from "../lib/events";
import { formatMs, recentMs } from "../lib/stats";
import { describeResult } from "../lib/summary";
import { Confirm, LineChart, Seg } from "../components/ui";

const SPEED_COLORS = [
  [900, "color-mix(in srgb, var(--good) 55%, transparent)", "under 0.9 s"],
  [1500, "color-mix(in srgb, var(--good) 22%, transparent)", "0.9–1.5 s"],
  [2500, "color-mix(in srgb, var(--warn) 40%, transparent)", "1.5–2.5 s"],
  [Infinity, "color-mix(in srgb, var(--bad) 45%, transparent)", "slower"],
];
const colorFor = (ms) => (ms == null ? "var(--line)" : SPEED_COLORS.find(([lim]) => ms < lim)[1]);
const day = (r) => new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Heat({ src }) {
  const { codeStats, system, cardMap } = useApp();
  const tip = (k, ms) => `${src === "cards" ? cardLabel(k) + " → " + cardMap[k] : k}: ${(src === "cards" ? describe(system, cardMap[k]) : describe(system, k)) || "no image"} · ${formatMs(ms)}`;
  if (src === "cards") {
    return (
      <div className="stack sm" style={{ maxWidth: 560 }}>
        {SUITS.map((s) => (
          <div key={s} style={{ display: "grid", gridTemplateColumns: "repeat(13,1fr)", gap: 3 }}>
            {VALUES.map((v) => {
              const id = v + s, ms = recentMs(codeStats[statKey("cards", id)]);
              return <div key={id} title={tip(id, ms)} style={{ background: colorFor(ms), aspectRatio: "0.75", borderRadius: 5, display: "grid", placeItems: "center", fontSize: ".7rem", color: s === "H" || s === "D" ? "var(--red-suit)" : "var(--ink)" }}>{cardLabel(id)}</div>;
            })}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="heat">
      {KEYS.map((k) => { const ms = recentMs(codeStats[statKey("numbers", k)]); return <div key={k} title={tip(k, ms)} style={{ background: colorFor(ms) }}>{k}</div>; })}
    </div>
  );
}

export default function Progress() {
  const { results, actions } = useApp();
  const [src, setSrc] = useState("numbers");
  const [del, setDel] = useState(null);

  const runs = results.filter((r) => r.kind === "run" && r.src === "numbers" && r.complete && r.count >= 50);
  const speedNum = results.filter((r) => r.kind === "numbers" && r.preset === "speed");
  const league = results.filter((r) => r.kind === "numbers" && r.preset === "league");
  const decks = results.filter((r) => r.kind === "cards" && r.perfect);
  const cardScores = results.filter((r) => r.kind === "cards" && r.preset === "speed");

  const causes = {};
  for (const r of results) {
    if (!r.causes) continue;
    for (const c of Object.values(r.causes)) if (c) causes[c] = (causes[c] || 0) + 1;
  }
  const causeList = Object.entries(causes).sort((a, b) => b[1] - a[1]);
  const maxCause = causeList[0]?.[1] || 1;

  return (
    <div className="stack lg">
      <h1>Progress</h1>

      <section className="stack">
        <div className="row between wrap"><h2>How fast each image comes</h2><Seg label="Which" value={src} onChange={setSrc} options={[["numbers", "Numbers"], ["cards", "Cards"]]} /></div>
        <p className="muted small">From your last five answers in drills. Hover or long-press for details. Red and orange ones are where speed is hiding.</p>
        <Heat src={src} />
        <p className="legend">{SPEED_COLORS.map(([, c, t]) => <span key={t}><i style={{ background: c }} />{t}</span>)}<span><i style={{ background: "var(--line)" }} />not timed yet</span></p>
      </section>

      <section className="grid2">
        {runs.length > 0 && <div className="panel stack sm"><b>Speed run, all numbers</b><span className="tiny muted">total time, lower is better</span>
          <LineChart points={runs.map((r) => ({ x: day(r), y: r.totalMs / 1000 }))} format={(v) => Math.round(v) + "s"} invert /></div>}
        {speedNum.length > 0 && <div className="panel stack sm"><b>Speed Numbers score</b><span className="tiny muted">5 minutes, competition marking</span>
          <LineChart points={speedNum.map((r) => ({ x: day(r), y: r.score }))} format={(v) => Math.round(v)} /></div>}
        {decks.length > 0 && <div className="panel stack sm"><b>Perfect deck time</b><span className="tiny muted">lower is better</span>
          <LineChart points={decks.map((r) => ({ x: day(r), y: r.memoMs / 1000 }))} format={(v) => Math.round(v) + "s"} invert /></div>}
        {league.length > 0 && <div className="panel stack sm"><b>Memory League style numbers</b><span className="tiny muted">correct digits out of 80</span>
          <LineChart points={league.map((r) => ({ x: day(r), y: r.score }))} format={(v) => Math.round(v)} /></div>}
        {cardScores.some((r) => !r.perfect) && <div className="panel stack sm"><b>Speed Cards, imperfect decks</b><span className="tiny muted">cards before the first mistake</span>
          <LineChart points={cardScores.filter((r) => !r.perfect).map((r) => ({ x: day(r), y: r.score }))} format={(v) => Math.round(v)} /></div>}
      </section>

      <section className="stack sm">
        <h2>Why mistakes happen</h2>
        {causeList.length === 0 ? <p className="muted small">After an event, pick a reason for each mistake and the pattern shows up here.</p> : (
          <div className="stack sm" style={{ maxWidth: 560 }}>
            {causeList.map(([c, n]) => (
              <div key={c} className="stack" style={{ gap: 2 }}>
                <div className="row between small"><span>{causeLabel(c)}</span><b className="num">{n}</b></div>
                <div className="progress" style={{ flex: "none" }}><div style={{ width: `${(n / maxCause) * 100}%` }} /></div>
              </div>
            ))}
            <p className="muted small">{advice(causeList[0][0])}</p>
          </div>
        )}
      </section>

      <section className="stack sm">
        <h2>History</h2>
        {results.length === 0 ? <p className="muted">Nothing yet. <Link to="/train">Start training</Link>.</p> : (
          <div className="scroll-x"><table className="plain"><thead><tr><th>When</th><th>What</th><th>Result</th><th /></tr></thead><tbody>
            {results.slice().reverse().slice(0, 200).map((r) => {
              const d = describeResult(r);
              return (
                <tr key={r.id}>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                  <td>{d.title}<div className="tiny muted">{d.sub}</div></td>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>{d.value}</td>
                  <td><button className="link small" style={{ color: "var(--muted)" }} onClick={() => setDel(r)} aria-label="Delete this result">✕</button></td>
                </tr>
              );
            })}
          </tbody></table></div>
        )}
      </section>
      <Confirm open={!!del} danger title="Delete this result?" text={del ? describeResult(del).title : ""} yes="Delete" onNo={() => setDel(null)} onYes={() => { actions.deleteResult(del.id); setDel(null); }} />
    </div>
  );
}

function advice(top) {
  return {
    image: "Most mistakes come from weak images. Do a speed run, then rework the slowest ones: more personal, more action, more feeling.",
    stop: "You lose your place in journeys. Do the journey drill in random order, and pick stops that look more different from each other.",
    link: "Images don't stick to their stops. Make each image touch the stop: break it, burn it, soak it. Use sound, smell and feeling.",
    order: "Images swap places. Make the person act on the object in a fixed way, and give the second image at a stop its own spot.",
    focus: "Rushing costs you. Slow down by 10% for a week and only speed up once you are accurate.",
    slip: "You knew it but entered it wrong. Check each group as you enter it, and use the recall time you have.",
  }[top] || "";
}
