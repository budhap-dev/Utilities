import { computeDiff } from '../src/lib/diff';

describe('computeDiff', () => {
  test('identical inputs', () => {
    const r = computeDiff('a\nb\n', 'a\nb\n');
    expect(r.identical).toBe(true);
    expect(r.rows.every((x) => x.type === 'eq')).toBe(true);
  });
  test('counts additions and removals', () => {
    const r = computeDiff('a\nb\nc', 'a\nc\nd');
    expect(r.removed).toBe(1);
    expect(r.added).toBe(1);
  });
  test('pairs modified lines with inline segments', () => {
    const r = computeDiff('hello world', 'hello there');
    const mod = r.rows.find((x) => x.type === 'mod');
    expect(mod).toBeTruthy();
    expect(mod.left.segments.some((s) => s.type === 'del')).toBe(true);
    expect(mod.right.segments.some((s) => s.type === 'add')).toBe(true);
  });
  test('ignores whitespace when asked', () => {
    expect(computeDiff('a  b', 'a b', { ignoreWhitespace: true }).identical).toBe(true);
    expect(computeDiff('a  b', 'a b').identical).toBe(false);
  });
});
