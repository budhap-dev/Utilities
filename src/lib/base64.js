export function encodeBase64(text, { urlSafe = false, noPadding = false } = {}) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  let out = btoa(bin);
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
  if (noPadding || urlSafe) out = out.replace(/=+$/, '');
  return out;
}

export function decodeBase64(text) {
  let s = text.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  // Strip data URI prefix if present
  const m = /^data:[^;]*;base64,(.*)$/.exec(s);
  if (m) s = m[1];
  const pad = s.length % 4;
  if (pad === 1) throw new Error('Invalid Base64 length');
  if (pad) s += '='.repeat(4 - pad);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('Input contains characters outside the Base64 alphabet');
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function bytesToBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function base64UrlDecodeToString(s) {
  return decodeBase64(s);
}
