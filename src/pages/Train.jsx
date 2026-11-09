import { Link } from "react-router-dom";
import { useApp } from "../store/context";
import { best } from "../lib/summary";
import { formatMs } from "../lib/stats";

function Tile({ to, title, text, stat }) {
  return (
    <Link to={to} className="tile">
      <b>{title}</b>
      <span className="small muted">{text}</span>
      {stat && <span className="small" style={{ marginTop: "auto" }}>{stat}</span>}
    </Link>
  );
}

export default function Train() {
  const { results } = useApp();
  const b = best(results);
  return (
    <div className="stack lg">
      <div className="stack sm">
        <h1>Train</h1>
        <p className="muted">Drills build the parts. Events put them together under competition rules.</p>
      </div>
      <section className="stack">
        <h2>Drills</h2>
        <div className="grid3">
          <Tile to="/drill/codes" title="Spaced review" text="Learn your number images and keep them fresh. Do this every day." />
          <Tile to="/drill/codes?mode=speed" title="Speed run: numbers" text="All your numbers, as fast as you can. Aim for under 1 second each." stat={b.run100 && `Best full run: ${formatMs(b.run100)}`} />
          <Tile to="/drill/codes?mode=speed&src=cards" title="Speed run: cards" text="Card → image, with no number in between." stat={b.run52 && `Best full run: ${formatMs(b.run52)}`} />
          <Tile to="/drill/journey" title="Journey drill" text="Walk a journey forwards, backwards or by random stop number." />
        </div>
      </section>
      <section className="stack">
        <h2>Events</h2>
        <div className="grid3">
          <Tile to="/event/numbers" title="Numbers" text="Speed Numbers, Memory League style, binary, or your own settings." stat={b.speedNumbers != null && `Best Speed Numbers: ${b.speedNumbers}`} />
          <Tile to="/event/cards" title="Cards" text="Speed Cards, Memory League style, or untimed practice." stat={b.deck && `Best deck: ${formatMs(b.deck)}`} />
        </div>
        <p className="muted small">Coming next: words, names and faces, images, dates, and spoken numbers, in English and Vietnamese.</p>
      </section>
    </div>
  );
}
