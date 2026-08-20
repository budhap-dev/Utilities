import { encodeBase64, decodeBase64 } from '../src/lib/base64';
import { decodeJwt, SAMPLE_JWT } from '../src/lib/jwt';

describe('base64', () => {
  test('round-trips unicode', () => {
    const s = 'Hello 👋 Ünïcödé';
    expect(decodeBase64(encodeBase64(s))).toBe(s);
  });
  test('url-safe alphabet', () => {
    const out = encodeBase64('\xff\xfe\xfd??>>', { urlSafe: true });
    expect(out).not.toMatch(/[+/=]/);
    expect(decodeBase64(out)).toBe('\xff\xfe\xfd??>>');
  });
  test('rejects bad input', () => {
    expect(() => decodeBase64('!!!')).toThrow();
  });
  test('strips data URI prefix', () => {
    expect(decodeBase64('data:text/plain;base64,aGk=')).toBe('hi');
  });
});

describe('jwt', () => {
  test('decodes sample', () => {
    const r = decodeJwt(SAMPLE_JWT);
    expect(r.ok).toBe(true);
    expect(r.header.alg).toBe('HS256');
    expect(r.payload.name).toBe('John Doe');
    expect(r.payload.exp).toBe(1516242622);
  });
  test('strips Bearer prefix', () => {
    expect(decodeJwt('Bearer ' + SAMPLE_JWT).ok).toBe(true);
  });
  test('rejects malformed', () => {
    expect(decodeJwt('abc').ok).toBe(false);
    expect(decodeJwt('a.b.c').error).toMatch(/Header/);
  });
});
