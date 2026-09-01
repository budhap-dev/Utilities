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
  test('parses standard 5-field expressions', () => {
    const p = parseCron('*/15 9-17 * * mon-fri');
    expect(p.format).toBe('standard');
    expect([...p.minute.set]).toEqual([0, 15, 30, 45]);
    expect(p.hour.set.size).toBe(9);
    expect([...p.dow.set]).toEqual([1, 2, 3, 4, 5]);
  });
  test('detects 6-field (seconds) and 7-field (quartz) layouts', () => {
    const six = parseCron('*/30 * * * * *');
    expect(six.format).toBe('seconds');
    expect([...six.second.set]).toEqual([0, 30]);
    const seven = parseCron('0 0 9 ? * MON-FRI 2027');
    expect(seven.format).toBe('quartz');
    expect(seven.hasSeconds && seven.hasYear).toBe(true);
    expect([...seven.year.set]).toEqual([2027]);
    expect([...seven.dow.set]).toEqual([1, 2, 3, 4, 5]); // Quartz names normalised to 0=SUN
  });
  test('quartz numeric weekdays use 1 = Sunday', () => {
    expect([...parseCron('0 0 0 ? * 1 *').dow.set]).toEqual([0]);
    expect([...parseCron('0 0 0 ? * 7 *').dow.set]).toEqual([6]);
    expect([...parseCron('0 0 * * 0').dow.set]).toEqual([0]);
  });
  test('explicit format must match field count', () => {
    expect(() => parseCron('* * * * *', 'quartz')).toThrow(/7 fields/);
  });
  test('aliases', () => {
    expect(parseCron('@daily').fields.map((f) => f.raw).join(' ')).toBe('0 0 * * *');
  });
  test('rejects bad input', () => {
    expect(() => parseCron('* * *')).toThrow(/5, 6 or 7 fields/);
    expect(() => parseCron('60 * * * *')).toThrow(/range/);
    expect(() => parseCron('0 0 0 15W * ? *')).toThrow(/Unsupported/);
  });
  test('next runs (5 fields)', () => {
    const from = new Date(2026, 0, 1, 10, 7); // local
    const runs = nextRuns('30 9 * * *', 2, from);
    expect(runs[0].getHours()).toBe(9);
    expect(runs[0].getMinutes()).toBe(30);
    expect(runs[0].getDate()).toBe(2);
    expect(runs[1].getDate()).toBe(3);
  });
  test('next runs with seconds', () => {
    const from = new Date(2026, 0, 1, 10, 0, 0);
    const runs = nextRuns('*/20 * * * * *', 3, from);
    expect(runs.map((d) => d.getSeconds())).toEqual([20, 40, 0]);
    expect(runs[2].getMinutes()).toBe(1);
  });
  test('quartz year, L and # tokens', () => {
    const from = new Date(2026, 0, 1);
    const y = nextRuns('0 0 0 1 1 ? 2028', 1, from)[0];
    expect(y.getFullYear()).toBe(2028);
    const last = nextRuns('0 0 12 L * ? *', 2, from);
    expect(last[0].getDate()).toBe(31); // Jan 31
    expect(last[1].getDate()).toBe(28); // Feb 28 2026
    const thirdFri = nextRuns('0 0 12 ? * FRI#3 *', 1, from)[0];
    expect(thirdFri.getDay()).toBe(5);
    expect(thirdFri.getDate()).toBe(16); // 3rd Friday of Jan 2026
    const lastFri = nextRuns('0 0 12 ? * FRIL *', 1, from)[0];
    expect(lastFri.getDate()).toBe(30); // last Friday of Jan 2026
  });
  test('past-only year yields no runs', () => {
    expect(nextRuns('0 0 0 1 1 ? 2020', 3, new Date(2026, 0, 1))).toEqual([]);
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
