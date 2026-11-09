import { Link } from "react-router-dom";
import { useApp } from "../store/context";
import { CAUSES, chainLoci } from "../lib/events";

export function JourneyPicker({ value, onChange, needed }) {
  const { journeys } = useApp();
  const have = chainLoci(journeys, value).length;
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="stack sm">
      <span className="label">Journeys to use, in order</span>
      {journeys.length === 0 ? (
        <p className="small muted">No journeys yet. You can still practise, but <Link to="/journeys">make a journey</Link> so mistakes can be traced to a stop.</p>
      ) : (
        <>
          <div className="seg">
            {journeys.map((j) => {
              const pos = value.indexOf(j.id);
              return (
                <button key={j.id} type="button" className={`btn small${pos >= 0 ? " on" : ""}`} onClick={() => toggle(j.id)} aria-pressed={pos >= 0}>
                  {pos >= 0 && <b>{pos + 1}.</b>} {j.name} <span className="muted">({j.loci.length})</span>
                </button>
              );
            })}
          </div>
          <p className={`small ${value.length && have < needed ? "warn" : "muted"}`}>
            {value.length ? `${have} stops chosen, ${needed} needed for everything.` : `Optional. You need about ${needed} stops for everything.`}
          </p>
        </>
      )}
    </div>
  );
}

// One row per stop with a mistake, and a choice of what went wrong.
export function MistakeList({ groups, causes, onCause, loci }) {
  if (!groups.length) return null;
  return (
    <div className="stack sm">
      <h2>What went wrong?</h2>
      <p className="muted small">Pick a reason for each one. Over time the Progress page shows which part of your method needs work.</p>
      <ul className="list">
        {groups.map((g) => {
          const l = loci[g.group];
          return (
            <li key={g.group} className="item" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
              <div className="stack sm grow" style={{ minWidth: 200 }}>
                <b>Stop {g.group + 1}{l ? ` · ${l.name}` : ""}{l && <span className="muted small"> ({l.journey} {l.n})</span>}</b>
                <span className="small">{g.detail}</span>
              </div>
              <select value={causes[g.group] || ""} onChange={(e) => onCause(g.group, e.target.value)} style={{ maxWidth: 260 }} aria-label={`Reason for stop ${g.group + 1}`}>
                <option value="">Choose a reason…</option>
                {CAUSES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
