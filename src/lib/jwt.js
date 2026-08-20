import { decodeBase64 } from './base64';

export function decodeJwt(token) {
  const t = (token || '').trim().replace(/^Bearer\s+/i, '');
  if (!t) return { ok: false, empty: true };
  const parts = t.split('.');
  if (parts.length < 2 || parts.length > 3) return { ok: false, error: `Expected 3 dot-separated parts, got ${parts.length}` };
  const [h, p, s = ''] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(decodeBase64(h));
  } catch {
    return { ok: false, error: 'Header is not valid Base64URL-encoded JSON' };
  }
  try {
    payload = JSON.parse(decodeBase64(p));
  } catch {
    return { ok: false, error: 'Payload is not valid Base64URL-encoded JSON' };
  }
  return { ok: true, header, payload, signature: s, raw: { header: h, payload: p } };
}

export const TIME_CLAIMS = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before', auth_time: 'Auth time' };

export const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.' +
  'KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
