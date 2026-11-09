import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp, statKey } from "../store/context";
import { describe, usableKeys } from "../lib/codes";
import { DECK, cardLabel } from "../lib/cards";
import { shuffle } from "../lib/random";
import { isDue } from "../lib/schedule";
import { dayKey, formatMs, recentMs } from "../lib/stats";
import { CardFace, FocusTop, Seg } from "../components/ui";
import { useKeys } from "../components/hooks";

const GRADES = [["again", "Again", "1"], ["hard", "Hard", "2"], ["good", "Good", "3"], ["easy", "Easy", "4"]];

// What can be drilled: numbers with an image, or cards whose number has an image.
function itemsFor(src, system, cardMap) {
  const usable = new Set(usableKeys(system));
  if (src === "cards") return DECK.filter((c) => usable.has(cardMap[c]));
  return [...usable];
}

function answerOf(src, item, system, cardMap) {
  if (src === "cards") return { main: describe(system, cardMap[item]), sub: `${cardLabel(item)} = ${cardMap[item]}` };
  return { main: describe(system, item), sub: "" };
}

function Prompt({ src, item }) {
  return src === "cards" ? <CardFace id={item} size="xl" /> : <div className="key">{item}</div>;
}

function Setup({ onStart }) {
  const { system, cardMap, codeStats, settings } = useApp();
  const [params] = useSearchParams();
  const [src, setSrc] = useState(params.get("src") === "cards" ? "cards" : "numbers");
  const [mode, setMode] = useState(params.get("mode") === "speed" ? "speed" : "review");
  const [scope, setScope] = useState("all");
  const items = itemsFor(src, system, cardMap);
  const now = new Date();
  const today = dayKey(now);
  const st = (it) => codeStats[statKey(src, it)];
  const due = items.filter((it) => st(it)?.srs && isDue(st(it).srs, now));
  const introducedToday = items.filter((it) => st(it)?.intro && dayKey(new Date(st(it).intro)) === today).length;
  const fresh = items.filter((it) => !st(it)?.srs).slice(0, Math.max(0, settings.newPerDay - introducedToday));
  const slow = [...items].filter((it) => recentMs(st(it)) != null).sort((a, b) => recentMs(st(b)) - recentMs(st(a))).slice(0, 20);

  const start = () => {
    if (mode === "review") onStart({ src, mode, queue: [...shuffle(due), ...fresh] });
    else onStart({ src, mode, queue: shuffle(scope === "slow" ? slow : items) });
  };
  const count = mode === "review" ? due.length + fresh.length : scope === "slow" ? slow.length : items.length;

  return (
    <div className="focus-body">
      <div className="stack lg" style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <h1>Image drill</h1>
        <div className="stack sm"><span className="label">What</span>
          <Seg label="What to drill" value={src} onChange={setSrc} options={[["numbers", "Numbers 00–99"], ["cards", "Cards"]]} /></div>
        <div className="stack sm"><span className="label">How</span>
          <Seg label="Drill type" value={mode} onChange={setMode} options={[["review", "Spaced review"], ["speed", "Speed run"]]} />
          <p className="muted small">{mode === "review"
            ? "Learn new images and review old ones just before you would forget them. Say the image to yourself, then reveal and grade honestly."
            : "Go through them as fast as you can. Tap the moment the full image is in your head; tap “Didn't come” if it doesn't. Your time for each one is saved, so the slow ones can be fixed."}</p>
        </div>
        {mode === "speed" && (
          <div className="stack sm"><span className="label">Which</span>
            <Seg label="Which ones" value={scope} onChange={setScope} options={[["all", `All ${items.length}`], ["slow", `Slowest ${slow.length}`]]} /></div>
        )}
        {items.length === 0 ? (
          <div className="notice warn">
            {src === "cards" ? "No card has a number with an image yet. " : "No numbers have an image yet. "}
            <Link to="/system">Fill in your number system</Link> first.
          </div>
        ) : mode === "review" && count === 0 ? (
          <div className="notice">Nothing is due. {fresh.length === 0 && introducedToday > 0 ? `You learned ${introducedToday} new ones today, which is your daily limit.` : ""} Try a speed run instead.</div>
        ) : null}
        {mode === "review" && items.length > 0 && <p className="small muted">{due.length} due · {fresh.length} new (up to {settings.newPerDay} new a day)</p>}
        <div><button className="btn primary big" disabled={!count} onClick={start}>Start {count ? `(${count})` : ""}</button></div>
      </div>
    </div>
  );
}

function Review({ run, onDone }) {
  const { system, cardMap, actions } = useApp();
  const [queue, setQueue] = useState(run.queue);
  const [shown, setShown] = useState(null);
  const [log, setLog] = useState([]);
  const t0 = useRef(performance.now());
  const item = queue[0];

  const reveal = () => { if (shown == null) setShown(performance.now() - t0.current); };
  const grade = (g) => {
    if (shown == null) return;
    actions.grade(statKey(run.src, item), g, shown);
    const entry = { item, grade: g, ms: shown };
    const nextLog = [...log, entry];
    const rest = queue.slice(1);
    const next = g === "again" ? [...rest, item] : rest;
    setLog(nextLog);
    if (!next.length) { onDone(nextLog); return; }
    setQueue(next);
    setShown(null);
    t0.current = performance.now();
  };
  useKeys((e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); reveal(); }
    const g = GRADES.find(([, , k]) => k === e.key);
    if (g) grade(g[0]);
  });
  const ans = answerOf(run.src, item, system, cardMap);
  const done = log.filter((l) => l.grade !== "again").length;

  return (
    <>
      <FocusTop title="Spaced review" onExit={() => onDone(log)}>
        <span className="small muted num">{queue.length} left</span>
      </FocusTop>
      <div className="focus-body">
        <div className="progress" style={{ flex: "none" }}><div style={{ width: `${(done / (done + queue.length)) * 100}%` }} /></div>
        <div className="prompt">
          <Prompt src={run.src} item={item} />
          {shown != null && <div className="answer">{ans.main || "—"}{ans.sub && <span className="sub">{ans.sub}</span>}<span className="sub">{formatMs(shown)}</span></div>}
        </div>
        {shown == null ? (
          <div className="bar-actions"><button className="btn primary big" onClick={reveal}>Show <span className="kbd">space</span></button></div>
        ) : (
          <div className="bar-actions">
            {GRADES.map(([g, label, k]) => <button key={g} className={`btn big${g === "good" ? " primary" : ""}`} onClick={() => grade(g)}>{label} <span className="kbd">{k}</span></button>)}
          </div>
        )}
      </div>
    </>
  );
}

function Speed({ run, onDone }) {
  const { system, cardMap } = useApp();
  const [i, setI] = useState(0);
  const [log, setLog] = useState([]);
  const t0 = useRef(performance.now());
  const start = useRef(performance.now());
  const item = run.queue[i];

  const next = (got) => {
    const now = performance.now();
    const entry = { item, ms: got ? now - t0.current : null };
    const nextLog = [...log, entry];
    setLog(nextLog);
    if (i + 1 >= run.queue.length) { onDone(nextLog, now - start.current); return; }
    setI(i + 1);
    t0.current = now;
  };
  useKeys((e) => {
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); next(true); }
    if (e.key === "x" || e.key === "X" || e.key === "ArrowDown") { e.preventDefault(); next(false); }
  });
  const prev = log[log.length - 1];
  const prevAns = prev && answerOf(run.src, prev.item, system, cardMap);

  return (
    <>
      <FocusTop title="Speed run" onExit={() => onDone(log, performance.now() - start.current)}>
        <span className="small muted num">{i + 1} / {run.queue.length}</span>
      </FocusTop>
      <div className="focus-body">
        <div className="progress" style={{ flex: "none" }}><div style={{ width: `${(i / run.queue.length) * 100}%` }} /></div>
        <div className="prompt" onClick={() => next(true)} style={{ cursor: "pointer", userSelect: "none" }}>
          <Prompt src={run.src} item={item} />
          <p className="muted small">Tap anywhere here when the image is clear</p>
        </div>
        <div className="bar-actions">
          <button className="btn big" onClick={() => next(false)}>Didn't come <span className="kbd">x</span></button>
          <button className="btn primary big" onClick={() => next(true)}>Got it <span className="kbd">space</span></button>
        </div>
        <p className="small muted" style={{ textAlign: "center", minHeight: "1.5em" }}>
          {prev && <>Last: <b>{run.src === "cards" ? cardLabel(prev.item) : prev.item}</b> = {prevAns.main} · {prev.ms == null ? <span className="bad">missed</span> : formatMs(prev.ms)}</>}
        </p>
      </div>
    </>
  );
}

function Summary({ run, log, totalMs, onAgain }) {
  const { system, cardMap } = useApp();
  const label = (it) => (run.src === "cards" ? cardLabel(it) : it);
  if (!log.length) return <div className="focus-body"><div className="center"><p>Stopped before any answers.</p><Link className="btn" to="/train">Back to training</Link></div></div>;

  if (run.mode === "review") {
    const counts = Object.fromEntries(GRADES.map(([g]) => [g, log.filter((l) => l.grade === g).length]));
    return (
      <div className="focus-body"><div className="stack lg" style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <h1>Review done</h1>
        <div className="grid3">
          <div className="tile"><span className="label">Answers</span><span className="big">{log.length}</span></div>
          <div className="tile"><span className="label">Again</span><span className="big">{counts.again}</span></div>
          <div className="tile"><span className="label">Median reveal</span><span className="big">{formatMs(median(log.map((l) => l.ms)))}</span></div>
        </div>
        <div className="row wrap"><button className="btn primary" onClick={onAgain}>New drill</button><Link className="btn" to="/">Today</Link></div>
      </div></div>
    );
  }

  const got = log.filter((l) => l.ms != null);
  const slowest = [...log].sort((a, b) => (b.ms ?? Infinity) - (a.ms ?? Infinity)).slice(0, 10);
  return (
    <div className="focus-body"><div className="stack lg" style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <h1>Speed run done</h1>
      <div className="grid3">
        <div className="tile"><span className="label">Total time</span><span className="big">{formatMs(totalMs)}</span><span className="small muted">{log.length} images</span></div>
        <div className="tile"><span className="label">Median</span><span className="big">{formatMs(median(got.map((l) => l.ms)))}</span></div>
        <div className="tile"><span className="label">Didn't come</span><span className={`big ${log.length - got.length ? "bad" : ""}`}>{log.length - got.length}</span></div>
      </div>
      <div className="stack sm">
        <h2>Slowest</h2>
        <p className="muted small">Fix these first. A slow image is usually a weak one: make it more vivid, more personal, or swap it for a person you feel more about.</p>
        <table className="plain"><tbody>
          {slowest.map((l, k) => (
            <tr key={k}>
              <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{label(l.item)}</td>
              <td>{answerOf(run.src, l.item, system, cardMap).main}</td>
              <td className={`num ${l.ms == null ? "bad" : ""}`} style={{ textAlign: "right", whiteSpace: "nowrap" }}>{l.ms == null ? "missed" : formatMs(l.ms)}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <div className="row wrap"><button className="btn primary" onClick={onAgain}>New drill</button><Link className="btn" to="/system">Edit images</Link><Link className="btn" to="/">Today</Link></div>
    </div></div>
  );
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default function CodeDrill() {
  const { actions } = useApp();
  const [run, setRun] = useState(null);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);

  const finish = (log, totalMs) => {
    if (log.length) {
      if (run.mode === "speed") {
        actions.recordTimes(Object.fromEntries(log.map((l) => [statKey(run.src, l.item), l.ms])));
        const got = log.filter((l) => l.ms != null);
        actions.addResult({ kind: "run", src: run.src, count: log.length, complete: log.length === run.queue.length, totalMs: Math.round(totalMs), medianMs: Math.round(median(got.map((l) => l.ms)) || 0), misses: log.length - got.length });
      } else {
        actions.addResult({ kind: "review", src: run.src, count: log.length, again: log.filter((l) => l.grade === "again").length });
      }
    }
    setResult({ log, totalMs });
  };

  if (result) return <><FocusTop title={run.mode === "speed" ? "Speed run" : "Spaced review"} /><Summary run={run} log={result.log} totalMs={result.totalMs} onAgain={() => { setRun(null); setResult(null); setRound(round + 1); }} /></>;
  if (run) return run.mode === "review" ? <Review run={run} onDone={finish} /> : <Speed run={run} onDone={finish} />;
  return <><FocusTop title="Image drill" /><Setup key={round} onStart={setRun} /></>;
}
