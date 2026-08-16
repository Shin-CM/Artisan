import pako from "pako";

const PREFIX = "v1:";

/** Export côté navigateur (aligné sur le codec Rust gzip + base64 URL-safe). */
export function exportPayloadToString(obj: unknown): string {
  const json = JSON.stringify(obj);
  const compressed = pako.gzip(json);
  const b64 = uint8ToBase64Url(compressed);
  return `${PREFIX}${b64}`;
}

export function importStringToPayload<T = unknown>(encoded: string): T {
  const t = encoded.trim();
  if (!t.startsWith(PREFIX)) {
    throw new Error("Chaîne invalide : préfixe v1: attendu");
  }
  const raw = base64UrlToUint8(t.slice(PREFIX.length));
  try {
    const out = pako.ungzip(raw, { to: "string" });
    return JSON.parse(out) as T;
  } catch {
    throw new Error("Données corrompues ou format inconnu");
  }
}

function uint8ToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

function base64UrlToUint8(b64: string): Uint8Array {
  let s = b64.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
