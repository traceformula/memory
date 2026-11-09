import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../store/context";
import { uid } from "../lib/random";

export default function Journeys() {
  const { journeys, actions } = useApp();
  const [name, setName] = useState("");
  const nav = useNavigate();
  const total = journeys.reduce((n, j) => n + j.loci.length, 0);

  const add = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const j = { id: uid(), name: n, loci: [], created: new Date().toISOString(), order: journeys.length };
    actions.saveJourney(j);
    setName("");
    nav("/journeys/" + j.id);
  };

  return (
    <div className="stack lg">
      <div className="stack sm">
        <h1>Journeys</h1>
        <p className="muted">A journey is a route through a place you know well, split into stops in a fixed order. You put images at the stops and walk the route again to recall them.</p>
      </div>

      <div className="grid3">
        <div className="tile"><span className="label">Journeys</span><span className="big">{journeys.length}</span></div>
        <div className="tile"><span className="label">Stops in all</span><span className="big">{total}</span></div>
        <div className="tile"><span className="label">Enough for</span><span className="small">{total >= 26 ? `${Math.floor(total / 26)} deck${total >= 52 ? "s" : ""} at 2 cards a stop` : `${26 - total} more stops for one deck`}<br />{total * 4} digits at 4 a stop</span></div>
      </div>

      {journeys.length > 0 && (
        <ul className="list">
          {journeys.map((j) => (
            <li key={j.id}>
              <Link to={"/journeys/" + j.id} className="item" style={{ color: "var(--ink)" }}>
                <b className="grow">{j.name}</b>
                <span className="muted small">{j.loci.length} stop{j.loci.length === 1 ? "" : "s"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form className="row" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New journey, e.g. My home" aria-label="New journey name" />
        <button className="btn primary" disabled={!name.trim()}>Add</button>
      </form>

      <div className="panel stack sm small">
        <b>Making good journeys</b>
        <ul className="muted" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Use places you can walk through in your head without effort: homes, schools, offices, a street you walk often.</li>
          <li>Always go the same way round. Pick stops that look different from each other: a sofa and an armchair are too alike.</li>
          <li>Start with 3 journeys of 20 to 30 stops. One deck needs 26 stops at 2 cards a stop.</li>
          <li>Rest a journey for a day or two after you use it, and rotate between them so old images fade.</li>
          <li>Walk each new journey forwards and backwards in the journey drill until it is automatic, before you use it for numbers or cards.</li>
        </ul>
      </div>
    </div>
  );
}
