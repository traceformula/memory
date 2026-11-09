// The number system: one image for each pair of digits 00–99.

export const KEYS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));

// Dominic O'Brien's letters: 1=A … 5=E, then 6=S (six), 7=G, 8=H, 9=N (nine), 0=O.
export const DOMINIC = "OABCDESGHN";
export const dominicLetters = (key) => [...key].map((d) => DOMINIC[+d]).join("");

// Major system consonant sounds for each digit.
export const MAJOR = ["s z", "t d", "n", "m", "r", "l", "j sh ch", "k g", "f v", "p b"];
export const majorHint = (key) => [...key].map((d) => MAJOR[+d]).join(" · ");

export const MODES = {
  pa: { label: "Person + action (Dominic)", fields: ["person", "action"] },
  pao: { label: "Person + action + object (PAO)", fields: ["person", "action", "object"] },
  image: { label: "One image per number (Major style)", fields: ["image"] },
};
export const FIELD_LABEL = { person: "Person", action: "Action", object: "Object", image: "Image" };

export const HELPERS = { dominic: "Dominic letters", major: "Major sounds", none: "No hint" };
export const hintFor = (helper, key) => (helper === "dominic" ? dominicLetters(key) : helper === "major" ? majorHint(key) : "");

export function emptySystem() {
  return { mode: "pa", helper: "dominic", entries: {} };
}

export const fieldsOf = (system) => MODES[system?.mode]?.fields || MODES.pa.fields;
const val = (e, f) => (e?.[f] || "").trim();

// Every field of the mode is written.
export const isComplete = (system, key) => fieldsOf(system).every((f) => val(system.entries[key], f));
// At least the main field (person or image) is written, so it can be drilled.
export const isUsable = (system, key) => !!val(system.entries[key], fieldsOf(system)[0]);

export const usableKeys = (system) => KEYS.filter((k) => isUsable(system, k));
export const completeCount = (system) => KEYS.filter((k) => isComplete(system, k)).length;

// One-line description of an entry, e.g. "Albert Einstein · writing on a blackboard".
export function describe(system, key) {
  const e = system.entries[key];
  return fieldsOf(system).map((f) => val(e, f)).filter(Boolean).join(" · ");
}

// Paste format: one line per number. Tabs, "|" or commas between fields.
// "15, Albert Einstein, writing on a blackboard"
export function parseBulk(text, mode) {
  const fields = MODES[mode].fields;
  const entries = {}, errors = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const sep = line.includes("\t") ? "\t" : line.includes("|") ? "|" : ",";
    const parts = line.split(sep).map((p) => p.trim());
    const key = parts.shift();
    if (!/^\d{1,2}$/.test(key)) { errors.push(`Line ${i + 1}: "${key}" is not a number from 0 to 99`); return; }
    if (!parts.length || !parts[0]) { errors.push(`Line ${i + 1}: nothing after the number`); return; }
    // Any extra separators belong to the last field, so a comma inside an action is kept.
    const vals = fields.map((_, j) => (j === fields.length - 1 ? parts.slice(j).join(sep === "\t" ? " " : sep + " ") : parts[j] || "").trim());
    entries[key.padStart(2, "0")] = Object.fromEntries(fields.map((f, j) => [f, vals[j]]));
  });
  return { entries, errors };
}

export function toBulk(system) {
  const fields = fieldsOf(system);
  return KEYS.filter((k) => isUsable(system, k))
    .map((k) => [k, ...fields.map((f) => val(system.entries[k], f))].join("\t"))
    .join("\n");
}
