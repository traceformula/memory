import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp, statKey } from "../store/context";
import { completeCount, DOMINIC, FIELD_LABEL, fieldsOf, HELPERS, hintFor, isComplete, isUsable, KEYS, MAJOR, MODES, parseBulk, toBulk } from "../lib/codes";
import { recentMs, formatMs } from "../lib/stats";
import { download } from "../lib/files";
import { EXAMPLES } from "../lib/examples";
import { Confirm, Dialog, Seg } from "../components/ui";

const LOOSE = Object.keys(EXAMPLES).filter((k) => EXAMPLES[k].loose).sort();

function PasteDialog({ open, onClose, mode }) {
  const { actions } = useApp();
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseBulk(text, mode) : null;
  const n = parsed ? Object.keys(parsed.entries).length : 0;
  const fields = MODES[mode].fields;
  const save = () => {
    actions.mergeEntries(parsed.entries);
    actions.say(`Saved ${n} number${n === 1 ? "" : "s"}`);
    setText("");
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <h2>Paste a list</h2>
      <p className="muted small">
        One number per line: <code>{["15", ...fields.map((f) => FIELD_LABEL[f].toLowerCase())].join(", ")}</code>.
        Tabs or | also work, so you can paste from a spreadsheet. Numbers you leave out stay as they are.
      </p>
      <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={"15, Albert Einstein, writing on a blackboard\n34, Charles Darwin, studying a finch"} aria-label="List to paste" />
      {parsed?.errors.length > 0 && <div className="notice warn small">{parsed.errors.slice(0, 5).map((e) => <div key={e}>{e}</div>)}{parsed.errors.length > 5 && <div>…and {parsed.errors.length - 5} more</div>}</div>}
      <div className="row end">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!n} onClick={save}>Save {n || ""}</button>
      </div>
    </Dialog>
  );
}

export default function System() {
  const { system, codeStats, actions } = useApp();
  const [view, setView] = useState({ filter: "all", keys: KEYS });
  const [paste, setPaste] = useState(false);
  const [fill, setFill] = useState(false);
  const fields = fieldsOf(system);
  const done = completeCount(system);
  const examples = system.helper === "dominic" && system.mode !== "image";
  // Only numbers with no person and no action yet, so your own choices are never mixed with an example.
  const blank = KEYS.filter((k) => !(system.entries[k]?.person || "").trim() && !(system.entries[k]?.action || "").trim());
  const useExamples = () => {
    actions.mergeEntries(Object.fromEntries(blank.map((k) => [k, { person: EXAMPLES[k].person, action: EXAMPLES[k].action }])));
    actions.say(`Filled ${blank.length} with examples`);
    setFill(false);
  };
  const placeholder = (k, f) => (examples && EXAMPLES[k][f] ? "e.g. " + EXAMPLES[k][f] : FIELD_LABEL[f]);

  // The list is worked out when you pick a filter, so a row doesn't vanish while you type in it.
  const pick = (filter) => setView({
    filter,
    keys: KEYS.filter((k) => {
      if (filter === "empty") return !isComplete(system, k);
      if (filter === "slow") { const ms = recentMs(codeStats[statKey("numbers", k)]); return ms != null && ms > 1500; }
      return true;
    }),
  });
  const { filter, keys: shown } = view;

  return (
    <div className="stack lg">
      <div className="stack sm">
        <h1>Number system</h1>
        <p className="muted">One image for every number from 00 to 99. This is the code you will use for numbers, cards, binary and dates, so take your time with it.</p>
      </div>

      <div className="panel stack">
        <div className="row between wrap">
          <b>{done} of 100 complete</b>
          <div className="progress" style={{ maxWidth: 260, minWidth: 120 }}><div style={{ width: done + "%" }} /></div>
        </div>
        <div className="grid2">
          <label className="field"><span>Type of image</span>
            <select value={system.mode} onChange={(e) => actions.setSystem({ ...system, mode: e.target.value })}>
              {Object.entries(MODES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Hint next to each number</span>
            <select value={system.helper} onChange={(e) => actions.setSystem({ ...system, helper: e.target.value })}>
              {Object.entries(HELPERS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </label>
        </div>
        {system.helper === "dominic" && (
          <div className="stack sm small">
            <p className="muted">Each digit is a letter. The two letters are the initials of a person, and each person has one signature action.</p>
            <div className="row wrap" style={{ gap: 6 }}>
              {[...DOMINIC].map((l, d) => <span key={d} className="tag" style={{ fontSize: ".86rem" }}>{d} = {l}</span>)}
            </div>
            <p className="muted">So 15 is A·E (Albert Einstein) and 34 is C·D (Charles Darwin). Initials are a starting point: a person you know well always beats a famous name you feel nothing about. For 4 digits, picture the first number's person doing the second number's action.</p>
            {examples && <>
              <p className="muted">The grey text in each row is an example person and action. Most are initials; {LOOSE.join(", ")} use the first letters of one name instead, like 95 = N·E = NEo. Swap in your own people whenever one doesn't grab you.</p>
              {blank.length > 0 && <div><button className="btn small" onClick={() => setFill(true)}>Use the examples for the {blank.length} empty number{blank.length === 1 ? "" : "s"}</button></div>}
            </>}
          </div>
        )}
        {system.helper === "major" && (
          <div className="stack sm small">
            <p className="muted">Each digit is a consonant sound. Fill in vowels to make a word: 21 is n·t, so “nut”.</p>
            <div className="row wrap" style={{ gap: 6 }}>{MAJOR.map((m, d) => <span key={d} className="tag" style={{ fontSize: ".86rem" }}>{d} = {m}</span>)}</div>
          </div>
        )}
      </div>

      <div className="stack">
        <div className="row between wrap">
          <Seg label="Show" value={filter} onChange={pick} options={[["all", "All 100"], ["empty", "Not finished"], ["slow", "Slow (over 1.5 s)"]]} />
          <div className="row wrap">
            <button className="btn small" onClick={() => setPaste(true)}>Paste a list</button>
            <button className="btn small" disabled={!KEYS.some((k) => isUsable(system, k))} onClick={() => download("number-system.tsv", toBulk(system), "text/tab-separated-values")}>Download as text</button>
          </div>
        </div>
        {shown.length === 0 && <p className="muted">{filter === "empty" ? "All 100 are complete. Now make them fast: " : "Nothing slow right now. "}<Link to="/drill/codes?mode=speed">Do a speed run</Link></p>}
        <div className="codes">
          {shown.map((k) => {
            const e = system.entries[k] || {};
            const ms = recentMs(codeStats[statKey("numbers", k)]);
            return (
              <div className="code-row" key={k}>
                <div className="code-key">
                  <b>{k}</b>
                  <span className="tiny muted">{hintFor(system.helper, k)}</span>
                  {ms != null && <span className={`tiny ${ms > 1500 ? "warn" : "muted"}`}>{formatMs(ms)}</span>}
                </div>
                <div className="code-fields">
                  {fields.map((f) => (
                    <input key={f} value={e[f] || ""} placeholder={placeholder(k, f)} aria-label={`${FIELD_LABEL[f]} for ${k}`}
                      onChange={(ev) => actions.setEntry(k, f, ev.target.value)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PasteDialog open={paste} onClose={() => setPaste(false)} mode={system.mode} />
      <Confirm open={fill} title={`Fill ${blank.length} numbers with examples?`} yes="Fill them"
        text="Only numbers with no person and no action are filled. You can change any of them later, and you should: your own people stick better."
        onNo={() => setFill(false)} onYes={useExamples} />
    </div>
  );
}
