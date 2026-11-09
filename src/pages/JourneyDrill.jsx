import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../store/context";
import { shuffle } from "../lib/random";
import { formatMs } from "../lib/stats";
import { FocusTop, Photo, Seg } from "../components/ui";
import { useKeys } from "../components/hooks";

const MODES = [["forward", "Forwards"], ["backward", "Backwards"], ["random", "Random stop"]];

export default function JourneyDrill() {
  const { journeys, actions } = useApp();
  const [params] = useSearchParams();
  const usable = journeys.filter((j) => j.loci.length >= 2);
  const [jid, setJid] = useState(params.get("j") || usable[0]?.id || "");
  const [mode, setMode] = useState("forward");
  const [run, setRun] = useState(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(null);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(null);
  const t0 = useRef(0), start = useRef(0);
  const j = journeys.find((x) => x.id === jid);

  const begin = () => {
    const idx = j.loci.map((_, k) => k);
    const order = mode === "forward" ? idx : mode === "backward" ? idx.reverse() : shuffle(idx);
    setRun({ order, j, mode });
    setI(0); setShown(null); setLog([]); setDone(null);
    t0.current = start.current = performance.now();
  };
  const finish = (finalLog) => {
    const totalMs = performance.now() - start.current;
    if (finalLog.length) actions.addResult({ kind: "journey", journeyId: run.j.id, name: run.j.name, mode: run.mode, count: finalLog.length, misses: finalLog.filter((l) => !l.got).length, totalMs: Math.round(totalMs) });
    setDone({ log: finalLog, totalMs });
  };
  const reveal = () => { if (shown == null) setShown(performance.now() - t0.current); };
  const mark = (got) => {
    if (shown == null) return;
    const next = [...log, { stop: run.order[i], got, ms: shown }];
    setLog(next);
    if (i + 1 >= run.order.length) { finish(next); return; }
    setI(i + 1); setShown(null); t0.current = performance.now();
  };
  useKeys((e) => {
    if (!run || done) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (shown == null) reveal(); else mark(true); }
    if (e.key === "1" || e.key === "x") mark(false);
    if (e.key === "2") mark(true);
  });

  if (done) {
    const missed = done.log.filter((l) => !l.got);
    return (
      <>
        <FocusTop title="Journey drill" />
        <div className="focus-body"><div className="stack lg" style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
          <h1>{run.j.name}</h1>
          <div className="grid3">
            <div className="tile"><span className="label">Stops</span><span className="big">{done.log.length}</span></div>
            <div className="tile"><span className="label">Missed</span><span className={`big ${missed.length ? "bad" : "good"}`}>{missed.length}</span></div>
            <div className="tile"><span className="label">Time</span><span className="big">{formatMs(done.totalMs)}</span></div>
          </div>
          {missed.length > 0 && (
            <div className="stack sm">
              <h2>Go and look at these again</h2>
              <ul className="list">{missed.map((l) => <li key={l.stop} className="item"><span className="num muted">{l.stop + 1}</span><span>{run.j.loci[l.stop].name}</span></li>)}</ul>
            </div>
          )}
          <div className="row wrap"><button className="btn primary" onClick={begin}>Again</button><button className="btn" onClick={() => { setRun(null); setDone(null); }}>Change</button><Link className="btn" to="/">Today</Link></div>
        </div></div>
      </>
    );
  }

  if (run) {
    const stop = run.order[i], locus = run.j.loci[stop];
    const prev = run.mode !== "random" && i > 0 ? run.j.loci[run.order[i - 1]] : null;
    return (
      <>
        <FocusTop title={run.j.name} onExit={() => finish(log)}><span className="small muted num">{i + 1} / {run.order.length}</span></FocusTop>
        <div className="focus-body">
          <div className="progress" style={{ flex: "none" }}><div style={{ width: `${(i / run.order.length) * 100}%` }} /></div>
          <div className="prompt">
            <div className="label">Stop</div>
            <div className="key">{stop + 1}</div>
            {prev && <p className="muted small">{run.mode === "forward" ? "after" : "before"} {prev.name}</p>}
            {shown != null && (
              <div className="stack" style={{ alignItems: "center" }}>
                <div className="answer">{locus.name}<span className="sub">{formatMs(shown)}</span></div>
                <Photo id={locus.photo} alt={locus.name} style={{ maxWidth: "min(90vw,420px)", maxHeight: 260 }} />
              </div>
            )}
          </div>
          {shown == null
            ? <div className="bar-actions"><button className="btn primary big" onClick={reveal}>Show <span className="kbd">space</span></button></div>
            : <div className="bar-actions">
                <button className="btn big" onClick={() => mark(false)}>Missed <span className="kbd">1</span></button>
                <button className="btn primary big" onClick={() => mark(true)}>Got it <span className="kbd">2</span></button>
              </div>}
        </div>
      </>
    );
  }

  return (
    <>
      <FocusTop title="Journey drill" />
      <div className="focus-body"><div className="stack lg" style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <h1>Journey drill</h1>
        <p className="muted">See a stop number, picture that stop, then check. Do new journeys forwards and backwards until every stop comes instantly. Random order trains you to jump straight to any stop.</p>
        {usable.length === 0 ? (
          <div className="notice warn">You need a journey with at least 2 stops. <Link to="/journeys">Make one</Link>.</div>
        ) : (
          <>
            <label className="field"><span>Journey</span>
              <select value={jid} onChange={(e) => setJid(e.target.value)}>
                {usable.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.loci.length} stops)</option>)}
              </select>
            </label>
            <Seg label="Order" value={mode} onChange={setMode} options={MODES} />
            <div><button className="btn primary big" disabled={!j || j.loci.length < 2} onClick={begin}>Start</button></div>
          </>
        )}
      </div></div>
    </>
  );
}
