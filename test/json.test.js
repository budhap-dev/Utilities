import { parseJson, formatJson, sortKeysDeep, escapeJsonString, unescapeJsonString, jsonStats } from '../src/lib/json';

describe('parseJson', () => {
  test('parses valid JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
  });
  test('reports empty input', () => {
    expect(parseJson('   ').empty).toBe(true);
  });
  test('locates a trailing comma', () => {
    const r = parseJson('{\n  "a": 1,\n}');
    expect(r.ok).toBe(false);
    expect(r.error.line).toBe(3);
    expect(r.error.message).toMatch(/Trailing comma/);
  });
  test('locates unterminated string', () => {
    const r = parseJson('{"a": "oops}');
    expect(r.ok).toBe(false);
    expect(r.error.message).toMatch(/Unterminated/);
  });
  test('locates missing colon with line/column', () => {
    const r = parseJson('{"a" 1}');
    expect(r.error.line).toBe(1);
    expect(r.error.column).toBe(6);
  });
});

describe('formatters', () => {
  test('sorts keys deeply', () => {
    expect(JSON.stringify(sortKeysDeep({ b: { z: 1, a: 2 }, a: [{ y: 1, x: 2 }] }))).toBe('{"a":[{"x":2,"y":1}],"b":{"a":2,"z":1}}');
  });
  test('formats with tabs', () => {
    expect(formatJson({ a: 1 }, 'tab')).toBe('{\n\t"a": 1\n}');
  });
  test('escape / unescape round trip', () => {
    const s = 'He said "hi"\nnew line';
    expect(unescapeJsonString(escapeJsonString(s))).toBe(s);
  });
  test('stats', () => {
    expect(jsonStats({ a: [1, 2, { b: 3 }] })).toEqual({ keys: 2, depth: 4, nodes: 6 });
  });
});
