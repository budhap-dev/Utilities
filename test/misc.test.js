import { parseColor, toHex, toHslString, contrastRatio } from '../src/lib/color';
import { parseCron, nextRuns } from '../src/lib/cron';
import { CASES, textStats, splitWords } from '../src/lib/text';
import { parseDateInput } from '../src/lib/datetime';

describe('color', () => {
  test('parses hex, rgb, hsl, names', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(79, 107, 237)')).toEqual({ r: 79, g: 107, b: 237, a: 1 });
    expect(toHex(parseColor('hsl(0, 100%, 50%)'))).toBe('#ff0000');
    expect(toHex(parseColor('navy'))).toBe('#000080');
    expect(parseColor('nope')).toBeNull();
  });
  test('hsl string', () => {
    expect(toHslString(parseColor('#ff0000'))).toBe('hsl(0, 100%, 50%)');
  });
  test('contrast black/white is 21', () => {
    expect(contrastRatio(parseColor('#000'), parseColor('#fff'))).toBeCloseTo(21, 1);
  });
});

describe('cron', () => {
  test('parses fields', () => {
    const f = parseCron('*/15 9-17 * * mon-fri');
    expect([...f[0].set]).toEqual([0, 15, 30, 45]);
    expect(f[1].set.size).toBe(9);
    expect([...f[4].set]).toEqual([1, 2, 3, 4, 5]);
  });
  test('aliases', () => {
    expect(parseCron('@daily').map((f) => f.raw).join(' ')).toBe('0 0 * * *');
  });
  test('rejects bad input', () => {
    expect(() => parseCron('* * *')).toThrow(/5 fields/);
    expect(() => parseCron('60 * * * *')).toThrow(/range/);
  });
  test('next runs', () => {
    const from = new Date(2026, 0, 1, 10, 7); // local
    const runs = nextRuns('30 9 * * *', 2, from);
    expect(runs[0].getHours()).toBe(9);
    expect(runs[0].getMinutes()).toBe(30);
    expect(runs[0].getDate()).toBe(2);
    expect(runs[1].getDate()).toBe(3);
  });
});

describe('text', () => {
  test('splits words from mixed input', () => {
    expect(splitWords('convert this_text-to anyCase')).toEqual(['convert', 'this', 'text', 'to', 'any', 'Case']);
  });
  test('case conversions', () => {
    const get = (id) => CASES.find((c) => c.id === id).fn('hello big world');
    expect(get('camel')).toBe('helloBigWorld');
    expect(get('pascal')).toBe('HelloBigWorld');
    expect(get('snake')).toBe('hello_big_world');
    expect(get('kebab')).toBe('hello-big-world');
    expect(get('constant')).toBe('HELLO_BIG_WORLD');
  });
  test('stats', () => {
    expect(textStats('one two\nthree.')).toMatchObject({ lines: 2, words: 3, sentences: 1 });
  });
});

describe('datetime', () => {
  test('auto-detects epoch units', () => {
    expect(parseDateInput('1692525600').date.toISOString()).toBe('2023-08-20T10:00:00.000Z');
    expect(parseDateInput('1692525600000').date.toISOString()).toBe('2023-08-20T10:00:00.000Z');
    expect(parseDateInput('1692525600').kind).toBe('epoch (s)');
  });
  test('parses ISO', () => {
    expect(parseDateInput('2026-08-20T09:30:00Z').date.getTime()).toBe(Date.UTC(2026, 7, 20, 9, 30));
  });
  test('invalid', () => {
    expect(parseDateInput('not a date').ok).toBe(false);
  });
});
