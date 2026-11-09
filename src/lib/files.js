// Backups, downloads and photo resizing. Browser only.
import { getAll, kvGet } from "./db.js";

const KV_KEYS = ["system", "cardMap", "settings", "codeStats"];

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

export async function buildBackup() {
  const kv = {};
  for (const k of KV_KEYS) { const v = await kvGet(k); if (v !== undefined) kv[k] = v; }
  const photos = await Promise.all((await getAll("photos")).map(async (p) => ({ id: p.id, data: await blobToDataUrl(p.blob) })));
  return { app: "memory-trainer", version: 1, exportedAt: new Date().toISOString(), kv, journeys: await getAll("journeys"), results: await getAll("results"), photos };
}

export async function readBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { throw new Error("That file is not a backup from this app."); }
  if (data?.app !== "memory-trainer" || typeof data.kv !== "object" || !Array.isArray(data.journeys) || !Array.isArray(data.results)) {
    throw new Error("That file is not a backup from this app.");
  }
  const kv = Object.fromEntries(Object.entries(data.kv).filter(([k]) => KV_KEYS.includes(k)));
  const photos = [];
  for (const p of data.photos || []) {
    if (typeof p?.id === "string" && /^data:image\/[a-z+]+;base64,/.test(p.data || "")) photos.push({ id: p.id, blob: await (await fetch(p.data)).blob() });
  }
  return { kv, journeys: data.journeys, results: data.results, photos };
}

export function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Shrink a photo to at most `max` pixels on its long side, as JPEG, so storage stays small.
export async function resizePhoto(file, max = 1024) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that photo."))), "image/jpeg", 0.8));
}
