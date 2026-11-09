import { useEffect, useState } from "react";
import { useApp } from "../store/context";
import { buildBackup, download, readBackup } from "../lib/files";
import { dayKey } from "../lib/stats";
import { Confirm } from "../components/ui";

export default function Data() {
  const { settings, results, journeys, actions } = useApp();
  const [storage, setStorage] = useState(null);
  const [pending, setPending] = useState(null);
  const [wipe, setWipe] = useState(false);
  const [busy, setBusy] = useState(false);

  const check = () => {
    Promise.all([navigator.storage?.persisted?.(), navigator.storage?.estimate?.()])
      .then(([persisted, est]) => setStorage({ persisted, used: est?.usage })).catch(() => setStorage({}));
  };
  useEffect(check, []);

  const exportAll = async () => {
    setBusy(true);
    try {
      download(`memory-training-${dayKey()}.json`, JSON.stringify(await buildBackup()));
    } catch (e) { actions.say("Backup failed: " + (e?.message || e)); }
    setBusy(false);
  };
  const pick = async (file) => {
    if (!file) return;
    try { setPending(await readBackup(file)); } catch (e) { actions.say(e.message); }
  };
  const restore = async () => {
    const data = pending;
    setPending(null);
    try { await actions.replaceEverything(data); } catch (e) { actions.say("Restore failed, nothing was changed: " + (e?.message || e)); }
  };

  return (
    <div className="stack lg" style={{ maxWidth: 680 }}>
      <h1>Backup and data</h1>
      <p className="muted">Everything you make here is stored in this browser on this device: your number system, card map, journeys and photos, and every result. Nothing is sent anywhere. A backup file is the only way to move it to another device or get it back if the browser's data is cleared.</p>

      <section className="panel stack">
        <b>Backup</b>
        <p className="small muted">{journeys.length} journeys, {results.length} results.</p>
        <div className="row wrap">
          <button className="btn primary" disabled={busy} onClick={exportAll}>{busy ? "Preparing…" : "Download backup"}</button>
          <label className="btn file">Restore from a backup<input type="file" accept="application/json,.json" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} /></label>
        </div>
      </section>

      <section className="panel stack sm">
        <b>Storage</b>
        {storage && <p className="small">{storage.persisted ? "This browser has agreed to keep the data even when space runs low." : "This browser may clear the data if the device runs low on space. Back up regularly."}</p>}
        {storage?.used != null && <p className="small muted">Using about {(storage.used / 1048576).toFixed(1)} MB.</p>}
        {!storage?.persisted && <div><button className="btn small" onClick={() => navigator.storage?.persist?.().then(check)}>Ask to keep the data</button></div>}
      </section>

      <section className="panel stack sm">
        <b>Spaced review</b>
        <label className="field"><span>New images per day</span>
          <input type="number" min={1} max={100} value={settings.newPerDay} onChange={(e) => actions.setSettings({ newPerDay: Math.max(1, Math.min(100, +e.target.value || 1)) })} style={{ maxWidth: 120 }} />
        </label>
      </section>

      <section className="stack sm">
        <div><button className="btn danger" onClick={() => setWipe(true)}>Delete everything</button></div>
      </section>

      <Confirm open={!!pending} title="Replace everything with this backup?" danger yes="Replace"
        text={pending ? `The backup has ${pending.journeys.length} journeys and ${pending.results.length} results. What is on this device now will be replaced.` : ""}
        onNo={() => setPending(null)} onYes={restore} />
      <Confirm open={wipe} title="Delete everything?" danger yes="Delete everything" text="Your number system, journeys, photos and results are removed from this device. Download a backup first if you might want them."
        onNo={() => setWipe(false)} onYes={() => { setWipe(false); actions.replaceEverything({}); }} />
    </div>
  );
}
