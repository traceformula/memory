import { Link } from "react-router-dom";
import { useApp, statKey } from "../store/context";
import { completeCount, usableKeys } from "../lib/codes";
import { isDue } from "../lib/schedule";
import { doneToday, formatMs, recentMs, streak } from "../lib/stats";
import { best, describeResult } from "../lib/summary";

function Step({ done, to, title, text }) {
  return (
    <div className="check">
      <span className={`dot${done ? " done" : ""}`} aria-label={done ? "done today" : "not done yet"}>{done ? "✓" : ""}</span>
      <div className="stack sm grow">
        <b>{title}</b>
        <span className="small muted">{text}</span>
      </div>
      <Link className={`btn small${done ? "" : " primary"}`} to={to}>{done ? "Again" : "Start"}</Link>
    </div>
  );
}

export default function Today() {
  const { system, codeStats, journeys, results } = useApp();
  const complete = completeCount(system);
  const usable = usableKeys(system);
  const stops = journeys.reduce((n, j) => n + j.loci.length, 0);
  const now = new Date();
  const due = usable.filter((k) => { const s = codeStats[statKey("numbers", k)]?.srs; return !s || isDue(s, now); }).length;
  const times = usable.map((k) => recentMs(codeStats[statKey("numbers", k)])).filter((x) => x != null).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : null;
  const b = best(results);
  const days = streak(results, now);
  const did = (kinds) => doneToday(results, kinds, now);

  // Stage 1: build the code. Stage 2: make it fast. Stage 3: events.
  const stage = complete < 100 || stops < 26 ? 1 : times.length < 100 || median > 1200 ? 2 : 3;

  return (
    <div className="stack lg">
      <div className="row between wrap">
        <div className="stack sm">
          <h1>Today</h1>
          <span className="muted">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
        <div className="tile" style={{ minWidth: 130, alignItems: "center" }}><span className="label" style={{ margin: 0 }}>Streak</span><span className="big">{days}</span><span className="tiny muted">day{days === 1 ? "" : "s"}</span></div>
      </div>

      <section className="panel">
        <span className="label">Stage {stage} of 3 · {["", "Build your code", "Make it fast", "Compete"][stage]}</span>
        {stage === 1 && <>
          <Step done={complete >= 100} to="/system" title={`Number system: ${complete} of 100`} text="Add 10 or more people and actions a day. Start with people you know and feel strongly about." />
          <Step done={stops >= 26} to="/journeys" title={`Journeys: ${stops} stops`} text="Build 3 journeys of 20–30 stops. You need 26 for one deck." />
          {usable.length > 0 && <Step done={did(["review"])} to="/drill/codes" title={`Spaced review${due ? ` · ${due} waiting` : ""}`} text="Learn the images you have written so far." />}
          {journeys.some((j) => j.loci.length >= 2) && <Step done={did(["journey"])} to="/drill/journey" title="Walk a journey" text="Forwards and backwards until every stop is instant." />}
        </>}
        {stage === 2 && <>
          <Step done={did(["review"])} to="/drill/codes" title={`Spaced review${due ? ` · ${due} waiting` : ""}`} text="Keep every image solid." />
          <Step done={did(["run"])} to="/drill/codes?mode=speed" title="Speed run, all 100" text={`Your median is ${formatMs(median)} per image. Get it under 1 second, then fix the slowest.`} />
          <Step done={did(["journey"])} to="/drill/journey" title="Journey drill" text="Random order: jump straight to any stop number." />
          <Step done={did(["numbers", "cards"])} to="/event/cards?preset=practice" title="One easy event" text="A practice deck or a short numbers round, to start joining the parts." />
        </>}
        {stage === 3 && <>
          <Step done={did(["review", "run"])} to="/drill/codes?mode=speed" title="Warm up: speed run" text={`Median ${formatMs(median)} per image.`} />
          <Step done={did(["numbers"])} to="/event/numbers" title="Numbers" text={b.speedNumbers != null ? `Best Speed Numbers: ${b.speedNumbers}. Accuracy first, then more rows.` : "Start with 2 rows and no mistakes."} />
          <Step done={did(["cards"])} to="/event/cards" title="Cards" text={b.deck ? `Best deck: ${formatMs(b.deck)}.` : "Get one perfect deck, however slow."} />
          <Step done={false} to="/progress" title="Look at your mistakes" text="Which reason comes up most? That is tomorrow's focus." />
        </>}
      </section>

      <div className="grid3">
        <Link to="/drill/codes?mode=speed" className="tile"><span className="label">Median per image</span><span className="big">{formatMs(median)}</span><span className="tiny muted">{times.length} of 100 timed</span></Link>
        <Link to="/event/numbers" className="tile"><span className="label">Best Speed Numbers</span><span className="big">{b.speedNumbers ?? "—"}</span><span className="tiny muted">points, 5 minutes</span></Link>
        <Link to="/event/cards" className="tile"><span className="label">Best deck</span><span className="big">{b.deck ? formatMs(b.deck) : "—"}</span><span className="tiny muted">perfect decks only</span></Link>
      </div>

      {results.length > 0 && (
        <section className="stack sm">
          <h2>Recent</h2>
          <ul className="list">
            {results.slice(-6).reverse().map((r) => {
              const d = describeResult(r);
              return (
                <li key={r.id} className="item">
                  <div className="stack sm grow"><b className="small">{d.title}</b><span className="tiny muted">{new Date(r.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{d.sub ? " · " + d.sub : ""}</span></div>
                  <span className="num">{d.value}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {results.length === 0 && (
        <div className="notice">New here? Read the <Link to="/guide">guide</Link> first: it explains the method and the plan in five minutes. Everything stays on this device, so make a <Link to="/data">backup</Link> now and then.</div>
      )}
    </div>
  );
}
