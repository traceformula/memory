import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cardLabel, isRed, SUIT_SYMBOL, valueLabel } from "../lib/cards";
import { getOne } from "../lib/db";
import { formatClock } from "../lib/stats";
import { useTick } from "./hooks";

export function CardFace({ id, size = "md", used, onClick, title }) {
  if (!id) return <span className={`pcard ${size} empty`} aria-label="empty">·</span>;
  const cls = `pcard ${size}${isRed(id) ? " red" : ""}${used ? " used" : ""}`;
  const face = (
    <span className={cls} aria-label={cardLabel(id)} title={title}>
      <span>{valueLabel(id)}</span>
      <span className="s">{SUIT_SYMBOL[id[1]]}</span>
    </span>
  );
  if (!onClick) return face;
  return <button type="button" className="pick" onClick={onClick} aria-label={cardLabel(id)}>{face}</button>;
}

export function Clock({ start, limitMs, running = true }) {
  useTick(running);
  const elapsed = performance.now() - start;
  if (!limitMs) return <span className="clock">{formatClock(elapsed)}</span>;
  const left = limitMs - elapsed;
  return <span className={`clock${left < 30000 ? " low" : ""}`} aria-label="time left">{formatClock(left)}</span>;
}

export function FocusTop({ title, exitTo = "/train", onExit, children }) {
  return (
    <div className="focus-top">
      {onExit ? <button className="btn small" onClick={onExit}>✕</button> : <Link className="btn small" to={exitTo} aria-label="Leave">✕</Link>}
      <span className="title grow">{title}</span>
      {children}
    </div>
  );
}

export function Dialog({ open, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onCancel={onClose}>
      {open && <div className="dialog-body">{children}</div>}
    </dialog>
  );
}

export function Confirm({ open, title, text, yes = "Yes", danger, onYes, onNo }) {
  return (
    <Dialog open={open} onClose={onNo}>
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      <div className="row end">
        <button className="btn" onClick={onNo}>Cancel</button>
        <button className={`btn ${danger ? "danger" : "primary"}`} onClick={onYes}>{yes}</button>
      </div>
    </Dialog>
  );
}

// Loads a journey stop's photo from the device.
export function Photo({ id, alt = "", className = "", style }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!id) return;
    let live = true, made = null;
    getOne("photos", id).then((p) => {
      if (!live || !p?.blob) return;
      made = URL.createObjectURL(p.blob);
      setUrl(made);
    }).catch(() => {});
    return () => { live = false; if (made) URL.revokeObjectURL(made); setUrl(null); };
  }, [id]);
  if (!id || !url) return null;
  return <img src={url} alt={alt} className={className} style={{ borderRadius: 10, objectFit: "cover", ...style }} />;
}

// A simple line chart. points: [{ x: label, y: number }]
export function LineChart({ points, height = 160, format = (v) => v, invert = false }) {
  if (points.length < 2) return <p className="muted small">Do this a couple more times to see a trend.</p>;
  const W = 600, H = height, L = 46, R = 10, T = 10, B = 22;
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1;
  lo -= pad; hi += pad;
  const x = (i) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (v) => (invert ? T + ((v - lo) / (hi - lo)) * (H - T - B) : H - B - ((v - lo) / (hi - lo)) * (H - T - B));
  const ticks = [lo + pad, (lo + hi) / 2, hi - pad];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="trend chart">
      {ticks.map((t, i) => (
        <g key={i}>
          <line className="gridline" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text x={L - 6} y={y(t) + 4} textAnchor="end">{format(t)}</text>
        </g>
      ))}
      <polyline className="line" points={points.map((p, i) => `${x(i)},${y(p.y)}`).join(" ")} />
      {points.map((p, i) => <circle key={i} className="pt" cx={x(i)} cy={y(p.y)} r={points.length > 40 ? 2 : 3.5}><title>{`${p.x}: ${format(p.y)}`}</title></circle>)}
      <text x={L} y={H - 4}>{points[0].x}</text>
      <text x={W - R} y={H - 4} textAnchor="end">{points[points.length - 1].x}</text>
    </svg>
  );
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={`btn small${value === v ? " on" : ""}`} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}
