import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppContext, DEFAULT_SETTINGS } from "./context";
import { deleteMany, getAll, kvGet, kvSet, putOne, replaceAll } from "../lib/db";
import { emptySystem } from "../lib/codes";
import { defaultCardMap } from "../lib/cards";
import { schedule } from "../lib/schedule";
import { addTime } from "../lib/stats";
import { uid } from "../lib/random";

async function loadAll() {
  const [system, cardMap, settings, codeStats, journeys, results] = await Promise.all([
    kvGet("system"), kvGet("cardMap"), kvGet("settings"), kvGet("codeStats"), getAll("journeys"), getAll("results"),
  ]);
  return {
    system: system || emptySystem(),
    cardMap: cardMap || defaultCardMap(),
    settings: { ...DEFAULT_SETTINGS, ...(settings || {}) },
    codeStats: codeStats || {},
    journeys: journeys.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.created?.localeCompare(b.created)),
    results: results.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export default function AppProvider({ children }) {
  const data = useRef(null);
  const [version, bump] = useReducer((x) => x + 1, 0);
  const [status, setStatus] = useState("loading");
  const [toast, setToast] = useState(null);
  const askedPersist = useRef(false);

  const fail = useCallback((e) => setToast({ text: "Could not save: " + (e?.message || e), bad: true }), []);
  const say = useCallback((text) => setToast({ text }), []);

  const reload = useCallback(() => {
    setStatus("loading");
    loadAll().then((d) => { data.current = d; setStatus("ready"); bump(); })
      .catch((e) => { setStatus("error: " + (e?.message || e)); });
  }, []);
  useEffect(reload, [reload]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.bad ? 6000 : 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const actions = useMemo(() => {
    const persistHint = () => {
      if (askedPersist.current) return;
      askedPersist.current = true;
      navigator.storage?.persisted?.().then((p) => { if (!p) navigator.storage.persist?.(); }).catch(() => {});
    };
    const setKv = (key, value) => {
      data.current = { ...data.current, [key]: value };
      bump();
      persistHint();
      return kvSet(key, value).catch(fail);
    };
    const get = () => data.current;
    const a = {
      setSystem: (system) => setKv("system", system),
      setEntry: (key, field, value) => {
        const s = get().system;
        return setKv("system", { ...s, entries: { ...s.entries, [key]: { ...s.entries[key], [field]: value } } });
      },
      mergeEntries: (entries) => {
        const s = get().system;
        const next = { ...s.entries };
        for (const [k, v] of Object.entries(entries)) next[k] = { ...next[k], ...v };
        return setKv("system", { ...s, entries: next });
      },
      setCardMap: (map) => setKv("cardMap", map),
      setSettings: (patch) => setKv("settings", { ...get().settings, ...patch }),
      setEventSettings: (event, patch) => {
        const s = get().settings;
        return setKv("settings", { ...s, events: { ...s.events, [event]: { ...s.events?.[event], ...patch } } });
      },
      // times: { "n:15": 840, "n:16": null } — null means the image did not come.
      recordTimes: (times) => {
        const stats = { ...get().codeStats };
        for (const [k, ms] of Object.entries(times)) stats[k] = addTime(stats[k], ms);
        return setKv("codeStats", stats);
      },
      grade: (key, grade, ms) => {
        const stats = { ...get().codeStats };
        const prev = stats[key] || {};
        stats[key] = { ...addTime(prev, grade === "again" ? null : ms), srs: schedule(prev.srs || {}, grade), intro: prev.intro || new Date().toISOString() };
        return setKv("codeStats", stats);
      },
      saveJourney: (j) => {
        const list = get().journeys;
        const next = list.some((x) => x.id === j.id) ? list.map((x) => (x.id === j.id ? j : x)) : [...list, j];
        data.current = { ...data.current, journeys: next };
        bump();
        persistHint();
        return putOne("journeys", j).catch(fail);
      },
      // Change a journey from its latest saved state, for edits that finish after an await.
      updateJourney: (id, fn) => {
        const j = get().journeys.find((x) => x.id === id);
        if (j) a.saveJourney(fn(j));
      },
      deleteJourney: async (id) => {
        const j = get().journeys.find((x) => x.id === id);
        data.current = { ...data.current, journeys: get().journeys.filter((x) => x.id !== id) };
        bump();
        try {
          await deleteMany("journeys", [id]);
          const photos = (j?.loci || []).map((l) => l.photo).filter(Boolean);
          if (photos.length) await deleteMany("photos", photos);
        } catch (e) { fail(e); }
      },
      savePhoto: async (blob) => {
        const id = uid();
        await putOne("photos", { id, blob });
        return id;
      },
      deletePhotos: (ids) => deleteMany("photos", ids).catch(fail),
      addResult: (r) => {
        const rec = { id: uid(), date: new Date().toISOString(), ...r };
        data.current = { ...data.current, results: [...get().results, rec] };
        bump();
        persistHint();
        putOne("results", rec).catch(fail);
        return rec;
      },
      updateResult: (id, patch) => {
        const rec = { ...get().results.find((r) => r.id === id), ...patch };
        data.current = { ...data.current, results: get().results.map((r) => (r.id === id ? rec : r)) };
        bump();
        return putOne("results", rec).catch(fail);
      },
      deleteResult: (id) => {
        data.current = { ...data.current, results: get().results.filter((r) => r.id !== id) };
        bump();
        return deleteMany("results", [id]).catch(fail);
      },
      replaceEverything: async (backup) => {
        await replaceAll(backup);
        reload();
      },
      say,
    };
    return a;
  }, [fail, say, reload]);

  // `version` changes on every edit, so consumers re-render with the new data.
  const value = useMemo(() => ({ ...(data.current || {}), version, status, actions, toast }), [version, status, actions, toast]);

  if (status === "loading") return <div className="center muted" role="status">Loading…</div>;
  if (status !== "ready") {
    return (
      <div className="center stack">
        <p>This browser could not open the app's storage ({status.replace(/^error: /, "")}).</p>
        <p className="muted small">Private browsing in some browsers blocks it.</p>
        <button className="btn primary" onClick={reload}>Try again</button>
      </div>
    );
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
