// Everything is kept in this browser's IndexedDB. Nothing leaves the device.
//   kv:       system, cardMap, settings, codeStats
//   journeys: { id, name, loci: [{ id, name, photo }] }
//   results:  one record per drill or event
//   photos:   { id, blob } for journey stops

const NAME = "memory-trainer";
const STORES = ["kv", "journeys", "results", "photos"];
let opening;

function open() {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, s === "kv" ? undefined : { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("Close other tabs of this app and reload."));
    });
  }
  return opening;
}

async function run(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let out;
    const req = fn(tx);
    if (req) req.onsuccess = () => { out = req.result; };
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Saving was cancelled. The device may be out of space."));
  });
}

export const kvGet = (key) => run("kv", "readonly", (tx) => tx.objectStore("kv").get(key));
export const kvSet = (key, value) => run("kv", "readwrite", (tx) => { tx.objectStore("kv").put(value, key); });
export const getAll = (store) => run(store, "readonly", (tx) => tx.objectStore(store).getAll());
export const getOne = (store, id) => run(store, "readonly", (tx) => tx.objectStore(store).get(id));
export const putOne = (store, value) => run(store, "readwrite", (tx) => { tx.objectStore(store).put(value); });
export const deleteMany = (store, ids) => run(store, "readwrite", (tx) => { for (const id of ids) tx.objectStore(store).delete(id); });

// Replace all data in one transaction, so a failed import leaves the old data untouched.
export function replaceAll({ kv = {}, journeys = [], results = [], photos = [] }) {
  return run(STORES, "readwrite", (tx) => {
    for (const s of STORES) tx.objectStore(s).clear();
    for (const [k, v] of Object.entries(kv)) tx.objectStore("kv").put(v, k);
    for (const j of journeys) tx.objectStore("journeys").put(j);
    for (const r of results) tx.objectStore("results").put(r);
    for (const p of photos) tx.objectStore("photos").put(p);
  });
}
