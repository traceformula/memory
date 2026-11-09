import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../store/context";
import { uid } from "../lib/random";
import { resizePhoto } from "../lib/files";
import { Confirm, Photo } from "../components/ui";

export default function JourneyEdit() {
  const { id } = useParams();
  const { journeys, actions } = useApp();
  const nav = useNavigate();
  const j = journeys.find((x) => x.id === id);
  const [bulk, setBulk] = useState("");
  const [del, setDel] = useState(false);

  if (!j) return <div className="center"><p>That journey is not here.</p><Link to="/journeys">All journeys</Link></div>;

  const save = (patch) => actions.saveJourney({ ...j, ...patch });
  const setLoci = (loci) => save({ loci });
  const addStops = (e) => {
    e.preventDefault();
    const names = bulk.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setLoci([...j.loci, ...names.map((name) => ({ id: uid(), name }))]);
    setBulk("");
  };
  const move = (i, d) => {
    const l = [...j.loci];
    [l[i], l[i + d]] = [l[i + d], l[i]];
    setLoci(l);
  };
  const remove = (i) => {
    const gone = j.loci[i];
    if (gone.photo) actions.deletePhotos([gone.photo]);
    setLoci(j.loci.filter((_, k) => k !== i));
  };
  const addPhoto = async (i, file) => {
    if (!file) return;
    try {
      const blob = await resizePhoto(file);
      const pid = await actions.savePhoto(blob);
      const stop = j.loci[i].id;
      let old;
      actions.updateJourney(j.id, (cur) => ({ ...cur, loci: cur.loci.map((l) => (l.id === stop ? ((old = l.photo), { ...l, photo: pid }) : l)) }));
      if (old) actions.deletePhotos([old]);
    } catch (e) {
      actions.say("Could not add the photo: " + (e?.message || e));
    }
  };
  const clearPhoto = (i) => {
    actions.deletePhotos([j.loci[i].photo]);
    setLoci(j.loci.map((l, k) => (k === i ? { ...l, photo: undefined } : l)));
  };

  return (
    <div className="stack lg">
      <div className="stack sm">
        <Link to="/journeys" className="small">← All journeys</Link>
        <input value={j.name} onChange={(e) => save({ name: e.target.value })} aria-label="Journey name" style={{ fontSize: "1.4rem", fontWeight: 700 }} />
        <div className="row wrap">
          <span className="muted small grow">{j.loci.length} stops</span>
          {j.loci.length >= 2 && <Link className="btn small" to={`/drill/journey?j=${j.id}`}>Walk it</Link>}
        </div>
      </div>

      {j.loci.length > 0 && (
        <ol className="list">
          {j.loci.map((l, i) => (
            <li key={l.id} className="item" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
              <span className="num muted" style={{ width: 28, paddingTop: 9, textAlign: "right" }}>{i + 1}</span>
              <div className="stack sm grow" style={{ minWidth: 180 }}>
                <input value={l.name} aria-label={`Stop ${i + 1}`} onChange={(e) => setLoci(j.loci.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                {l.photo && <Photo id={l.photo} alt={l.name} style={{ width: 120, height: 80 }} />}
              </div>
              <div className="row wrap" style={{ gap: 4 }}>
                <button className="btn small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button className="btn small" disabled={i === j.loci.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <label className="btn small file">{l.photo ? "New photo" : "Photo"}
                  <input type="file" accept="image/*" onChange={(e) => { addPhoto(i, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                {l.photo && <button className="btn small" onClick={() => clearPhoto(i)}>No photo</button>}
                <button className="btn small danger" onClick={() => remove(i)} aria-label="Remove stop">✕</button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form className="panel stack" onSubmit={addStops}>
        <b>Add stops</b>
        <p className="muted small">One per line, in walking order. They go after the last stop.</p>
        <textarea rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"Front door\nShoe rack\nMirror in the hall\nKitchen sink"} aria-label="Stops to add" />
        <div><button className="btn primary" disabled={!bulk.trim()}>Add stops</button></div>
      </form>

      <div><button className="btn danger" onClick={() => setDel(true)}>Delete this journey</button></div>
      <Confirm open={del} danger title={`Delete “${j.name}”?`} text="Its stops and photos are removed from this device." yes="Delete"
        onNo={() => setDel(false)} onYes={() => { actions.deleteJourney(j.id); nav("/journeys"); }} />
    </div>
  );
}
