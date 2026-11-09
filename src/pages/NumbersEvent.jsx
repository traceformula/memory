import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../store/context";
import { NUMBER_PRESETS, chainLoci, digitGroups, mistakesByGroup } from "../lib/events";
import { randomDigits } from "../lib/random";
import { scoreCount, scoreRows } from "../lib/scoring";
import { formatMs } from "../lib/stats";
import { Clock, Confirm, FocusTop, Seg } from "../components/ui";
import { useKeys } from "../components/hooks";
import { JourneyPicker, MistakeList } from "../components/EventParts";

function Setup({ onStart }) {
  const { settings, journeys, actions } = useApp();
  const saved = settings.events?.numbers || {};
  const [params] = useSearchParams();
  const asked = params.get("preset");
  const [preset, setPresetRaw] = useState(NUMBER_PRESETS[asked] ? asked : saved.preset && NUMBER_PRESETS[saved.preset] ? saved.preset : "speed");
  const p = NUMBER_PRESETS[preset];
  const mine = saved.byPreset?.[preset] || {};
  const [rows, setRows] = useState(mine.rows ?? p.rows);
  const [group, setGroup] = useState(mine.group ?? p.group);
  const [memoMin, setMemoMin] = useState(mine.memoMin ?? p.memoSec / 60);
  const [recallMin, setRecallMin] = useState(mine.recallMin ?? p.recallSec / 60);
  const [ids, setIds] = useState((saved.journeyIds || []).filter((id) => journeys.some((j) => j.id === id)));

  const setPreset = (k) => {
    const q = NUMBER_PRESETS[k], m = saved.byPreset?.[k] || {};
    setPresetRaw(k);
    setRows(m.rows ?? q.rows); setGroup(m.group ?? q.group);
    setMemoMin(m.memoMin ?? q.memoSec / 60); setRecallMin(m.recallMin ?? q.recallSec / 60);
  };
  const fixedRows = preset === "league";
  const total = (fixedRows ? p.rows : rows) * p.rowLen;
  const groups = digitGroups(total, p.rowLen, group);
  const custom = preset === "custom";

  const start = () => {
    actions.setEventSettings("numbers", { preset, journeyIds: ids, byPreset: { ...saved.byPreset, [preset]: { rows, group, memoMin, recallMin } } });
    onStart({
      preset, base: p.base, rowLen: p.rowLen, scoring: p.scoring, group,
      memoMs: (custom ? memoMin * 60 : p.memoSec) * 1000,
      recallMs: (custom ? recallMin * 60 : p.recallSec) * 1000,
      digits: randomDigits(total, p.base), groups, journeyIds: ids,
    });
  };

  return (
    <div className="focus-body"><div className="stack lg" style={{ maxWidth: 620, margin: "0 auto", width: "100%" }}>
      <h1>Numbers</h1>
      <div className="stack sm">
        <Seg label="Event" value={preset} onChange={setPreset} options={Object.entries(NUMBER_PRESETS).map(([k, v]) => [k, v.label])} />
        <p className="muted small">{p.note}</p>
      </div>
      <div className="grid2">
        {!fixedRows && (
          <label className="field"><span>Rows of {p.rowLen} ({total} digits)</span>
            <input type="number" min={1} max={40} value={rows} onChange={(e) => setRows(Math.max(1, Math.min(40, +e.target.value || 1)))} />
          </label>
        )}
        <label className="field"><span>{p.base === 2 ? "Bits" : "Digits"} per stop (one step of the highlight)</span>
          <select value={group} onChange={(e) => setGroup(+e.target.value)}>
            {(p.base === 2 ? [3, 6, 9, 12] : [2, 3, 4, 6, 8]).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {custom && <>
          <label className="field"><span>Minutes to memorise</span><input type="number" min={0.5} max={60} step={0.5} value={memoMin} onChange={(e) => setMemoMin(Math.max(0.5, +e.target.value || 1))} /></label>
          <label className="field"><span>Minutes to recall</span><input type="number" min={1} max={120} value={recallMin} onChange={(e) => setRecallMin(Math.max(1, +e.target.value || 1))} /></label>
        </>}
      </div>
      <JourneyPicker value={ids} onChange={setIds} needed={groups.length} />
      <div className="notice small">You can stop memorising early with “Done”; your time is saved. Use the arrow keys or space to move the highlight, or tap a group.</div>
      <div><button className="btn primary big" onClick={start}>Start memorising</button></div>
    </div></div>
  );
}

function Memorise({ sheet, onDone }) {
  const [cur, setCur] = useState(0);
  const start = useRef(performance.now());
  const curRef = useRef(null);
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; });
  useEffect(() => {
    const t = setTimeout(() => doneRef.current(sheet.memoMs), sheet.memoMs);
    return () => clearTimeout(t);
  }, [sheet.memoMs]);
  useEffect(() => { curRef.current?.scrollIntoView({ block: "nearest" }); }, [cur]);
  const n = sheet.groups.length;
  const rowStart = (row) => sheet.groups.findIndex((g) => g.row === row);
  useKeys((e) => {
    const g = sheet.groups[cur];
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCur(Math.min(n - 1, cur + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setCur(Math.max(0, cur - 1)); }
    if (e.key === "ArrowDown") { e.preventDefault(); const s = rowStart(g.row + 1); if (s >= 0) setCur(s); }
    if (e.key === "ArrowUp") { e.preventDefault(); const s = rowStart(g.row - 1); if (s >= 0) setCur(s); }
  });
  const byRow = groupRows(sheet.groups);
  return (
    <>
      <FocusTop title="Memorise">
        <Clock start={start.current} limitMs={sheet.memoMs} />
        <button className="btn primary small" onClick={() => onDone(performance.now() - start.current)}>Done</button>
      </FocusTop>
      <div className="focus-body">
        <p className="small muted">Stop {cur + 1} of {n}</p>
        <div className="sheet">
          {byRow.map((gs, r) => (
            <div className="sheet-row" key={r}>
              <span className="rn">{r + 1}</span>
              <div className="digits">
                {gs.map(({ g, k }) => (
                  <span key={k} ref={k === cur ? curRef : null} className={`grp${k === cur ? " cur" : ""}`} onClick={() => setCur(k)}>
                    {[...sheet.digits.slice(g.start, g.end)].map((d, i) => <span key={i} className="d">{d}</span>)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const groupRows = (groups) => {
  const rows = [];
  groups.forEach((g, k) => { (rows[g.row] ||= []).push({ g, k }); });
  return rows;
};

function Recall({ sheet, onDone }) {
  const total = sheet.digits.length;
  const [cells, setCells] = useState(() => Array(total).fill(""));
  const [cur, setCur] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const start = useRef(performance.now());
  const curRef = useRef(null);
  const latest = useRef({ cells, onDone });
  useEffect(() => { latest.current = { cells, onDone }; });
  useEffect(() => {
    const t = setTimeout(() => latest.current.onDone(latest.current.cells, sheet.recallMs), sheet.recallMs);
    return () => clearTimeout(t);
  }, [sheet.recallMs]);
  useEffect(() => { curRef.current?.scrollIntoView({ block: "nearest" }); }, [cur]);

  const type = (d) => { const c = [...cells]; c[cur] = d; setCells(c); setCur(Math.min(total - 1, cur + 1)); };
  const back = () => {
    const c = [...cells];
    if (c[cur] === "" && cur > 0) { c[cur - 1] = ""; setCur(cur - 1); } else c[cur] = "";
    setCells(c);
  };
  const insert = () => { const c = [...cells]; c.splice(cur, 0, ""); c.length = total; setCells(c); };
  const remove = () => { const c = [...cells]; c.splice(cur, 1); c.push(""); setCells(c); };
  const finish = () => onDone(cells, performance.now() - start.current);
  const digitsAllowed = sheet.base === 2 ? ["0", "1"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  useKeys((e) => {
    if (digitsAllowed.includes(e.key)) { e.preventDefault(); type(e.key); }
    else if (e.key === "Backspace") { e.preventDefault(); back(); }
    else if (e.key === "Delete") { e.preventDefault(); const c = [...cells]; c[cur] = ""; setCells(c); }
    else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCur(Math.min(total - 1, cur + 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setCur(Math.max(0, cur - 1)); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setCur(Math.min(total - 1, cur + sheet.rowLen)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCur(Math.max(0, cur - sheet.rowLen)); }
  });
  const byRow = groupRows(sheet.groups);
  const filled = cells.filter((c) => c !== "").length;

  return (
    <>
      <FocusTop title="Recall">
        <Clock start={start.current} limitMs={sheet.recallMs} />
        <button className="btn primary small" onClick={() => setConfirm(true)}>Finish</button>
      </FocusTop>
      <div className="focus-body">
        <p className="small muted">Type what you remember. Space skips a digit you don't know; the last row is marked up to the last digit you write. {filled} written.</p>
        <div className="sheet">
          {byRow.map((gs, r) => (
            <div className="sheet-row" key={r}>
              <span className="rn">{r + 1}</span>
              <div className="digits">
                {gs.map(({ g, k }) => (
                  <span key={k} className="grp" style={{ cursor: "default" }}>
                    {Array.from({ length: g.end - g.start }, (_, i) => {
                      const idx = g.start + i;
                      return <span key={idx} ref={idx === cur ? curRef : null} className={`cell${idx === cur ? " cur" : ""}`} onClick={() => setCur(idx)}>{cells[idx]}</span>;
                    })}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: "sticky", bottom: 0 }}>
          <div className="row" style={{ justifyContent: "center", gap: 6, background: "var(--bg)", paddingTop: 6 }}>
            <button className="btn small" onClick={insert}>Insert gap</button>
            <button className="btn small" onClick={remove}>Remove digit</button>
          </div>
          <div className="keypad">
            {digitsAllowed.map((d) => <button key={d} onClick={() => type(d)}>{d}</button>)}
            <button onClick={() => setCur(Math.max(0, cur - 1))} aria-label="Left">←</button>
            <button onClick={() => setCur(Math.min(total - 1, cur + 1))} aria-label="Right">→</button>
            <button onClick={back} aria-label="Delete">⌫</button>
            <button className="wide" onClick={() => setCur(Math.min(total - 1, cur + 1))}>Skip</button>
          </div>
        </div>
      </div>
      <Confirm open={confirm} title="Finish recall?" text="Your answers will be marked." yes="Mark it" onNo={() => setConfirm(false)} onYes={finish} />
    </>
  );
}

function Result({ sheet, rec, onAgain }) {
  const { journeys, results, actions } = useApp();
  const live = results.find((r) => r.id === rec.id) || rec;
  const loci = useMemo(() => chainLoci(journeys, sheet.journeyIds), [journeys, sheet.journeyIds]);
  const { cells, score } = rec.view;
  const rowPoints = score.rows ? Object.fromEntries(score.rows.map((r) => [r.row, r])) : null;
  const counted = (idx) => {
    if (!rowPoints) return idx <= score.lastGiven;
    const r = rowPoints[Math.floor(idx / sheet.rowLen)];
    return r.attempted && idx - r.row * sheet.rowLen < r.counted;
  };
  const groupOf = (i) => sheet.groups.findIndex((g) => i >= g.start && i < g.end);
  const mistakeGroups = mistakesByGroup(groupOf, score.mistakesAll).map(({ group }) => {
    const g = sheet.groups[group];
    const wrote = cells.slice(g.start, g.end).map((c) => c || "_").join("");
    return { group, detail: <>You wrote <b className="bad" style={{ fontFamily: "var(--mono)" }}>{wrote}</b>, it was <b style={{ fontFamily: "var(--mono)" }}>{sheet.digits.slice(g.start, g.end)}</b></> };
  });
  const setCause = (group, c) => actions.updateResult(rec.id, { causes: { ...live.causes, [group]: c } });
  const byRow = groupRows(sheet.groups);

  return (
    <>
      <FocusTop title="Result" />
      <div className="focus-body"><div className="stack lg" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div className="grid3">
          <div className="tile"><span className="label">Score</span><span className="big">{score.total}</span><span className="small muted">{sheet.scoring === "rows" ? `rows of ${sheet.rowLen}, competition marking` : "correct digits"}</span></div>
          <div className="tile"><span className="label">Correct</span><span className="big">{score.correct}<span className="muted" style={{ fontSize: "1rem" }}> / {sheet.digits.length}</span></span></div>
          <div className="tile"><span className="label">Memorised in</span><span className="big">{formatMs(rec.memoMs)}</span><span className="small muted">recall {formatMs(rec.recallMs)}</span></div>
        </div>
        <div className="sheet">
          {byRow.map((gs, r) => {
            const rp = rowPoints?.[r];
            return (
              <div className="sheet-row" key={r}>
                <span className="rn">{r + 1}</span>
                <div className="digits">
                  {gs.map(({ g, k }) => (
                    <span key={k} className="grp" style={{ cursor: "default" }}>
                      {Array.from({ length: g.end - g.start }, (_, i) => {
                        const idx = g.start + i, want = sheet.digits[idx], got = cells[idx];
                        if (!counted(idx)) return <span key={idx} className="cell muted" style={{ opacity: 0.45 }}>{want}</span>;
                        if (got === want) return <span key={idx} className="cell ok">{want}</span>;
                        if (got === "") return <span key={idx} className="cell miss" title="left blank">{want}</span>;
                        return <span key={idx} className="cell wrong" title={`you wrote ${got}`}>{want}</span>;
                      })}
                    </span>
                  ))}
                </div>
                {rp && <span className={`rp ${rp.points === 0 && rp.attempted ? "bad" : ""}`}>{rp.attempted ? rp.points : ""}</span>}
              </div>
            );
          })}
        </div>
        <p className="legend"><span><i style={{ background: "var(--bad)" }} />wrong</span><span><i style={{ background: "var(--warn)" }} />left blank</span><span><i style={{ background: "var(--line)" }} />not attempted</span></p>
        {mistakeGroups.length === 0 && score.correct > 0 && <p className="good"><b>No mistakes.</b> Next time try more digits or less time.</p>}
        <MistakeList groups={mistakeGroups} causes={live.causes || {}} onCause={setCause} loci={loci} />
        <div className="row wrap"><button className="btn primary" onClick={onAgain}>Go again</button><Link className="btn" to="/progress">Progress</Link><Link className="btn" to="/">Today</Link></div>
      </div></div>
    </>
  );
}

export default function NumbersEvent() {
  const { actions } = useApp();
  const [sheet, setSheet] = useState(null);
  const [phase, setPhase] = useState("setup");
  const [memoMs, setMemoMs] = useState(0);
  const [rec, setRec] = useState(null);
  const [round, setRound] = useState(0);

  const marked = (cells, recallMs) => {
    const score = sheet.scoring === "rows" ? scoreRows(sheet.digits, cells, sheet.rowLen) : scoreCount(sheet.digits, cells);
    const mistakesAll = score.rows ? score.rows.flatMap((r) => r.mistakes) : score.mistakes;
    const lastGiven = cells.reduce((m, c, i) => (c !== "" ? i : m), -1);
    const view = { cells, score: { ...score, mistakesAll, lastGiven } };
    const r = actions.addResult({
      kind: "numbers", preset: sheet.preset, base: sheet.base, digits: sheet.digits.length, score: score.total, correct: score.correct,
      memoMs: Math.round(memoMs), recallMs: Math.round(recallMs), group: sheet.group, mistakes: mistakesAll.length, causes: {},
    });
    setRec({ ...r, view });
    setPhase("result");
  };

  if (phase === "memo") return <Memorise sheet={sheet} onDone={(ms) => { setMemoMs(Math.min(ms, sheet.memoMs)); setPhase("recall"); }} />;
  if (phase === "recall") return <Recall sheet={sheet} onDone={marked} />;
  if (phase === "result") return <Result sheet={sheet} rec={rec} onAgain={() => { setPhase("setup"); setSheet(null); setRec(null); setRound(round + 1); }} />;
  return <><FocusTop title="Numbers" /><Setup key={round} onStart={(s) => { setSheet(s); setPhase("memo"); }} /></>;
}

