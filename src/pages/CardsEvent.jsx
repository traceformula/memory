import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../store/context";
import { CARD_PRESETS, chainLoci, mistakesByGroup } from "../lib/events";
import { DECK, SUITS, VALUES, cardLabel } from "../lib/cards";
import { describe } from "../lib/codes";
import { shuffle } from "../lib/random";
import { scoreCount, scoreSpeedCards } from "../lib/scoring";
import { formatClock, formatMs } from "../lib/stats";
import { CardFace, Clock, Confirm, FocusTop, Seg } from "../components/ui";
import { useKeys } from "../components/hooks";
import { JourneyPicker, MistakeList } from "../components/EventParts";

function Setup({ onStart }) {
  const { settings, journeys, actions } = useApp();
  const saved = settings.events?.cards || {};
  const [params] = useSearchParams();
  const asked = params.get("preset");
  const [preset, setPreset] = useState(CARD_PRESETS[asked] ? asked : saved.preset && CARD_PRESETS[saved.preset] ? saved.preset : "speed");
  const [per, setPer] = useState(saved.per || 2);
  const [ids, setIds] = useState((saved.journeyIds || []).filter((id) => journeys.some((j) => j.id === id)));
  const p = CARD_PRESETS[preset];
  const start = () => {
    actions.setEventSettings("cards", { preset, per, journeyIds: ids });
    onStart({ preset, per, scoring: p.scoring, memoMs: p.memoSec * 1000, recallMs: p.recallSec * 1000, deck: shuffle(DECK), journeyIds: ids });
  };
  return (
    <div className="focus-body"><div className="stack lg" style={{ maxWidth: 620, margin: "0 auto", width: "100%" }}>
      <h1>Cards</h1>
      <div className="stack sm">
        <Seg label="Event" value={preset} onChange={setPreset} options={Object.entries(CARD_PRESETS).map(([k, v]) => [k, v.label])} />
        <p className="muted small">{p.note}</p>
      </div>
      <div className="stack sm"><span className="label">Cards per stop</span>
        <Seg label="Cards per stop" value={per} onChange={setPer} options={[[1, "1"], [2, "2"], [3, "3"]]} />
        <p className="muted small">{per === 2 ? "Two cards are a person doing an action: the first card's person, the second card's action. 26 stops." : per === 1 ? "One card per stop: simplest, 52 stops." : "Three cards per stop needs a PAO system. 18 stops."}</p>
      </div>
      <JourneyPicker value={ids} onChange={setIds} needed={Math.ceil(52 / per)} />
      <div className="notice small">The clock starts when you press Start. Press “Done” the moment you have the deck: that is your time.</div>
      <div><button className="btn primary big" onClick={start}>Start memorising</button></div>
    </div></div>
  );
}

function Memorise({ run, onDone }) {
  const [g, setG] = useState(0);
  const start = useRef(performance.now());
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; });
  useEffect(() => {
    const t = setTimeout(() => doneRef.current(run.memoMs), run.memoMs);
    return () => clearTimeout(t);
  }, [run.memoMs]);
  const n = Math.ceil(52 / run.per);
  const go = (d) => setG((x) => Math.max(0, Math.min(n - 1, x + d)));
  useKeys((e) => {
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  const cards = run.deck.slice(g * run.per, g * run.per + run.per);
  return (
    <>
      <FocusTop title="Memorise">
        <Clock start={start.current} />
        <span className="tiny muted">of {formatClock(run.memoMs)}</span>
        <button className="btn primary small" onClick={() => onDone(performance.now() - start.current)}>Done</button>
      </FocusTop>
      <div className="focus-body">
        <div className="progress" style={{ flex: "none" }}><div style={{ width: `${((g + 1) / n) * 100}%` }} /></div>
        <div className="prompt" style={{ minHeight: "45vh" }}>
          <p className="muted small">Stop {g + 1} of {n} · cards {g * run.per + 1}–{Math.min(52, g * run.per + run.per)}</p>
          <div className="deck-view">{cards.map((c) => <CardFace key={c} id={c} size="xl" />)}</div>
        </div>
        <div className="bar-actions">
          <button className="btn big" disabled={g === 0} onClick={() => go(-1)}>← Back</button>
          <button className="btn primary big" disabled={g === n - 1} onClick={() => go(1)}>Next <span className="kbd">space</span></button>
        </div>
      </div>
    </>
  );
}

const VALUE_KEYS = { a: "A", 1: "A", t: "T", 0: "T", j: "J", q: "Q", k: "K", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9" };
const SUIT_KEYS = { s: "S", h: "H", d: "D", c: "C" };

function Recall({ run, onDone }) {
  const [slots, setSlots] = useState(() => Array(52).fill(""));
  const [cur, setCur] = useState(0);
  const [pending, setPending] = useState("");
  const [confirm, setConfirm] = useState(false);
  const start = useRef(performance.now());
  const latest = useRef({ slots, onDone });
  useEffect(() => { latest.current = { slots, onDone }; });
  useEffect(() => {
    const t = setTimeout(() => latest.current.onDone(latest.current.slots, run.recallMs), run.recallMs);
    return () => clearTimeout(t);
  }, [run.recallMs]);

  const curRef = useRef(null);
  useEffect(() => { curRef.current?.scrollIntoView({ block: "nearest" }); }, [cur]);

  const place = (card) => {
    const s = slots.map((x) => (x === card ? "" : x));
    s[cur] = card;
    setSlots(s);
    let next = cur + 1;
    while (next < 52 && s[next]) next++;
    setCur(next < 52 ? next : Math.min(51, cur + 1));
  };
  const clear = () => {
    const s = [...slots];
    if (!s[cur] && cur > 0) { s[cur - 1] = ""; setCur(cur - 1); } else s[cur] = "";
    setSlots(s);
  };
  useKeys((e) => {
    const k = e.key.toLowerCase();
    if (pending && SUIT_KEYS[k]) { e.preventDefault(); place(pending + SUIT_KEYS[k]); setPending(""); return; }
    if (VALUE_KEYS[k]) { e.preventDefault(); setPending(VALUE_KEYS[k]); return; }
    if (e.key === "Backspace") { e.preventDefault(); if (pending) setPending(""); else clear(); }
    if (e.key === "ArrowRight") { e.preventDefault(); setCur(Math.min(51, cur + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setCur(Math.max(0, cur - 1)); }
  });
  const used = new Set(slots.filter(Boolean));

  return (
    <>
      <FocusTop title="Recall">
        <Clock start={start.current} limitMs={run.recallMs} />
        <button className="btn primary small" onClick={() => setConfirm(true)}>Finish</button>
      </FocusTop>
      <div className="focus-body">
        <p className="small muted">Pick the cards in order. Tap a slot to change it. On a keyboard, type value then suit: <span className="kbd">q</span><span className="kbd">h</span> is Q♥, <span className="kbd">t</span> or <span className="kbd">0</span> is 10. {pending && <b>Waiting for a suit after {pending === "T" ? "10" : pending}…</b>}</p>
        <div className="slots">
          {slots.map((c, i) => (
            <button key={i} ref={i === cur ? curRef : null} type="button" className={`slot${i === cur ? " cur" : ""}`} onClick={() => setCur(i)} aria-label={`Slot ${i + 1}${c ? ": " + cardLabel(c) : ""}`}>
              <CardFace id={c} size="sm" />
              <span className="i">{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="picker panel tight">
          <div className="row between"><span className="small muted">Slot {cur + 1} · {used.size} of 52 placed</span><button className="btn small" onClick={clear}>Clear ⌫</button></div>
          {SUITS.map((s) => (
            <div key={s} className="picker-row">
              {VALUES.map((v) => <CardFace key={v + s} id={v + s} size="md" used={used.has(v + s)} onClick={() => place(v + s)} />)}
            </div>
          ))}
        </div>
      </div>
      <Confirm open={confirm} title="Finish recall?" text={`${used.size} of 52 cards placed.`} yes="Mark it" onNo={() => setConfirm(false)} onYes={() => onDone(slots, performance.now() - start.current)} />
    </>
  );
}

function Result({ run, rec, onAgain }) {
  const { journeys, results, system, cardMap, actions } = useApp();
  const live = results.find((r) => r.id === rec.id) || rec;
  const loci = useMemo(() => chainLoci(journeys, run.journeyIds), [journeys, run.journeyIds]);
  const { slots, score } = rec.view;
  const groups = mistakesByGroup((i) => Math.floor(i / run.per), score.mistakes).map(({ group }) => {
    const want = run.deck.slice(group * run.per, group * run.per + run.per);
    const got = slots.slice(group * run.per, group * run.per + run.per);
    const img = want.map((c) => describe(system, cardMap[c])).filter(Boolean).join(" + ");
    return { group, detail: <>You put <b className="bad">{got.map((c) => (c ? cardLabel(c) : "—")).join(" ")}</b>, it was <b>{want.map(cardLabel).join(" ")}</b>{img && <span className="muted"> ({img})</span>}</> };
  });
  const setCause = (group, c) => actions.updateResult(rec.id, { causes: { ...live.causes, [group]: c } });

  return (
    <>
      <FocusTop title="Result" />
      <div className="focus-body"><div className="stack lg" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div className="grid3">
          {run.scoring === "speed" ? (
            <div className="tile"><span className="label">{score.perfect ? "Perfect deck" : "Cards to first mistake"}</span>
              <span className={`big ${score.perfect ? "good" : ""}`}>{score.perfect ? formatMs(rec.memoMs) : score.upTo}</span>
              <span className="small muted">{score.perfect ? `${score.points} championship points` : "only a perfect deck is ranked by time"}</span></div>
          ) : (
            <div className="tile"><span className="label">Score</span><span className="big">{score.total}</span><span className="small muted">cards in the right place</span></div>
          )}
          <div className="tile"><span className="label">In the right place</span><span className="big">{score.correct}<span className="muted" style={{ fontSize: "1rem" }}> / 52</span></span></div>
          <div className="tile"><span className="label">Memorised in</span><span className="big">{formatMs(rec.memoMs)}</span><span className="small muted">recall {formatMs(rec.recallMs)}</span></div>
        </div>
        <div className="slots">
          {run.deck.map((c, i) => {
            const ok = slots[i] === c;
            return (
              <div key={i} className={`slot${ok ? "" : " wrong"}`} title={ok ? cardLabel(c) : `You put ${slots[i] ? cardLabel(slots[i]) : "nothing"}`}>
                <CardFace id={c} size="sm" />
                <span className="i" style={{ color: ok ? undefined : "var(--bad)" }}>{ok ? i + 1 : slots[i] ? cardLabel(slots[i]) : "—"}</span>
              </div>
            );
          })}
        </div>
        <p className="legend"><span>Each slot shows the right card. A red outline means a mistake; underneath is what you put.</span></p>
        {groups.length === 0 && <p className="good"><b>Perfect.</b> Now do it faster.</p>}
        <MistakeList groups={groups} causes={live.causes || {}} onCause={setCause} loci={loci} />
        <div className="row wrap"><button className="btn primary" onClick={onAgain}>Go again</button><Link className="btn" to="/progress">Progress</Link><Link className="btn" to="/">Today</Link></div>
      </div></div>
    </>
  );
}

export default function CardsEvent() {
  const { actions } = useApp();
  const [run, setRun] = useState(null);
  const [phase, setPhase] = useState("setup");
  const [memoMs, setMemoMs] = useState(0);
  const [rec, setRec] = useState(null);
  const [round, setRound] = useState(0);

  const marked = (slots, recallMs) => {
    const score = run.scoring === "speed" ? scoreSpeedCards(run.deck, slots, memoMs) : scoreCount(run.deck, slots);
    if (run.scoring !== "speed") score.correct = run.deck.filter((c, i) => slots[i] === c).length;
    // Slots after the last card you placed were not attempted, so they are not listed as mistakes.
    const last = slots.reduce((m, c, i) => (c ? i : m), -1);
    score.mistakes = score.mistakes.filter((i) => i <= last);
    const r = actions.addResult({
      kind: "cards", preset: run.preset, per: run.per, score: score.total, perfect: !!score.perfect, correct: score.correct,
      memoMs: Math.round(memoMs), recallMs: Math.round(recallMs), mistakes: score.mistakes.length, causes: {},
    });
    setRec({ ...r, view: { slots, score } });
    setPhase("result");
  };

  if (phase === "memo") return <Memorise run={run} onDone={(ms) => { setMemoMs(Math.min(ms, run.memoMs)); setPhase("recall"); }} />;
  if (phase === "recall") return <Recall run={run} onDone={marked} />;
  if (phase === "result") return <Result run={run} rec={rec} onAgain={() => { setPhase("setup"); setRun(null); setRec(null); setRound(round + 1); }} />;
  return <><FocusTop title="Cards" /><Setup key={round} onStart={(r) => { setRun(r); setPhase("memo"); }} /></>;
}
