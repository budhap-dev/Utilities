/**
 * Cron expression parser supporting three layouts:
 *
 *   standard (5): minute hour day-of-month month day-of-week
 *   seconds  (6): second minute hour day-of-month month day-of-week
 *   quartz   (7): second minute hour day-of-month month day-of-week year
 *
 * Supports * , - / ranges and steps, month / weekday names, `?` (no specific
 * value), `L` (last day of month / last weekday-of-month), `n#k` (k-th
 * weekday of month), `@daily`-style aliases, and a year field (1970–2099).
 * Day-of-week numbering: 0–7 with 0/7 = Sunday for standard/seconds layouts;
 * 1–7 with 1 = Sunday for the Quartz layout (Quartz convention).
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const DEFS = {
  second: { name: 'second', min: 0, max: 59 },
  minute: { name: 'minute', min: 0, max: 59 },
  hour: { name: 'hour', min: 0, max: 23 },
  dom: { name: 'day of month', min: 1, max: 31 },
  month: { name: 'month', min: 1, max: 12, names: MONTHS },
  dow: { name: 'day of week', min: 0, max: 7, names: DAYS },
  dowQuartz: { name: 'day of week', min: 1, max: 7, names: DAYS, quartz: true },
  year: { name: 'year', min: 1970, max: 2099 },
};

export const FORMATS = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'standard', label: 'Standard (5 fields)', count: 5 },
  { id: 'seconds', label: 'With seconds (6 fields)', count: 6 },
  { id: 'quartz', label: 'Quartz (7 fields)', count: 7 },
];

const LAYOUTS = {
  standard: ['minute', 'hour', 'dom', 'month', 'dow'],
  seconds: ['second', 'minute', 'hour', 'dom', 'month', 'dow'],
  quartz: ['second', 'minute', 'hour', 'dom', 'month', 'dowQuartz', 'year'],
};

const ALIASES = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export function detectFormat(expr) {
  const n = expr.trim().split(/\s+/).length;
  if (n === 5) return 'standard';
  if (n === 6) return 'seconds';
  if (n === 7) return 'quartz';
  throw new Error(`Expected 5, 6 or 7 fields, got ${n}`);
}

/** Convert a token to a number using the field's names, normalising DOW to 0–6. */
function toNum(tok, def) {
  const t = tok.toLowerCase();
  if (def.names) {
    const idx = def.names.indexOf(t.slice(0, 3));
    if (idx >= 0 && t.length === 3) return def.min === 1 && !def.quartz ? idx + 1 : def.quartz ? idx + 1 : idx;
  }
  if (!/^\d+$/.test(t)) throw new Error(`Invalid value "${tok}" in ${def.name} field`);
  return parseInt(t, 10);
}

function parseField(raw, def) {
  const f = { name: def.name, raw, min: def.min, max: def.max, set: new Set(), any: false, last: false, lastOffset: 0, lastOf: [], nth: [] };
  const isDow = def.name === 'day of week';
  const isDom = def.name === 'day of month';
  const normDow = (v) => (def.quartz ? v - 1 : v % 7); // → 0..6, Sunday = 0

  if (raw === '*' || raw === '?') {
    f.any = true;
    for (let v = def.min; v <= def.max; v++) f.set.add(isDow ? normDow(v) : v);
    return f;
  }

  raw.split(',').forEach((part) => {
    if (!part) throw new Error(`Empty list item in ${def.name} field`);
    // L / L-n in day-of-month
    if (isDom && /^l(-\d+)?$/i.test(part)) {
      f.last = true;
      f.lastOffset = part.length > 1 ? parseInt(part.slice(2), 10) : 0;
      return;
    }
    // nL (last weekday of month) in day-of-week
    let m;
    if (isDow && (m = /^([a-z0-9]+)l$/i.exec(part))) {
      f.lastOf.push(normDow(toNum(m[1], def)));
      return;
    }
    // n#k (k-th weekday of month)
    if (isDow && (m = /^([a-z0-9]+)#([1-5])$/i.exec(part))) {
      f.nth.push([normDow(toNum(m[1], def)), parseInt(m[2], 10)]);
      return;
    }
    if (/[lw#]/i.test(part)) throw new Error(`Unsupported token "${part}" in ${def.name} field`);

    const [range, stepStr] = part.split('/');
    const step = stepStr !== undefined ? parseInt(stepStr, 10) : 1;
    if (stepStr !== undefined && (!/^\d+$/.test(stepStr) || step < 1)) throw new Error(`Invalid step "/${stepStr}" in ${def.name} field`);
    let lo;
    let hi;
    if (range === '*' || range === '?') {
      lo = def.min;
      hi = def.max;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      lo = toNum(a, def);
      hi = toNum(b, def);
    } else {
      lo = toNum(range, def);
      hi = stepStr !== undefined ? def.max : lo;
    }
    if (lo < def.min || hi > def.max || lo > hi) throw new Error(`Value out of range in ${def.name} field (${def.min}–${def.max})`);
    for (let v = lo; v <= hi; v += step) f.set.add(isDow ? normDow(v) : v);
  });
  return f;
}

export function parseCron(expr, format = 'auto') {
  let e = (expr || '').trim();
  if (!e) throw new Error('Empty expression');
  if (ALIASES[e.toLowerCase()]) e = ALIASES[e.toLowerCase()];
  const detected = detectFormat(e);
  const fmt = format === 'auto' ? detected : format;
  const layout = LAYOUTS[fmt];
  if (!layout) throw new Error(`Unknown format "${format}"`);
  const tokens = e.split(/\s+/);
  if (tokens.length !== layout.length) {
    throw new Error(`${FORMATS.find((f) => f.id === fmt).label} needs ${layout.length} fields, got ${tokens.length}`);
  }
  const fields = layout.map((key, i) => parseField(tokens[i], DEFS[key]));
  const byName = Object.fromEntries(layout.map((key, i) => [key === 'dowQuartz' ? 'dow' : key, fields[i]]));
  return { format: fmt, fields, ...byName, hasSeconds: !!byName.second, hasYear: !!byName.year };
}

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

function dayMatches(date, dom, dow) {
  const d = date.getDate();
  const wd = date.getDay();
  const dim = daysInMonth(date.getFullYear(), date.getMonth());
  const domOk = dom.any ? true : dom.set.has(d) || (dom.last && d === dim - dom.lastOffset);
  const dowOk = dow.any
    ? true
    : dow.set.has(wd) || dow.lastOf.some((n) => n === wd && d + 7 > dim) || dow.nth.some(([n, k]) => n === wd && Math.ceil(d / 7) === k);
  if (dom.any && dow.any) return true;
  if (dom.any) return dowOk;
  if (dow.any) return domOk;
  return domOk || dowOk; // standard cron: OR when both restricted
}

/** Compute the next `count` run times after `from` (local time). */
export function nextRuns(expr, count = 5, from = new Date(), format = 'auto') {
  const p = parseCron(expr, format);
  const sec = p.second || { set: new Set([0]), any: false };
  const out = [];
  const d = new Date(from.getTime());
  d.setMilliseconds(0);
  d.setSeconds(d.getSeconds() + 1);
  let guard = 0;
  while (out.length < count && guard++ < 300000) {
    if (p.year && !p.year.any && !p.year.set.has(d.getFullYear())) {
      if (d.getFullYear() > p.year.max) break;
      d.setFullYear(d.getFullYear() + 1, 0, 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!p.month.set.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!dayMatches(d, p.dom, p.dow)) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!p.hour.set.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0, 0);
      continue;
    }
    if (!p.minute.set.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1, 0, 0);
      continue;
    }
    if (!sec.set.has(d.getSeconds())) {
      d.setSeconds(d.getSeconds() + 1, 0);
      continue;
    }
    out.push(new Date(d.getTime()));
    d.setSeconds(d.getSeconds() + 1);
  }
  return out;
}

/** Human-readable list of the values a field expands to. */
export function describeField(f) {
  if (f.any) return 'any';
  const parts = [];
  const vals = [...f.set].sort((a, b) => a - b);
  if (vals.length) parts.push(f.name === 'day of week' ? vals.map((v) => DAYS[v].toUpperCase()).join(', ') : vals.join(', '));
  if (f.last) parts.push(f.lastOffset ? `${f.lastOffset} days before last day` : 'last day of month');
  f.lastOf.forEach((n) => parts.push(`last ${DAYS[n].toUpperCase()} of month`));
  f.nth.forEach(([n, k]) => parts.push(`${k}${['st', 'nd', 'rd'][k - 1] || 'th'} ${DAYS[n].toUpperCase()} of month`));
  return parts.join('; ');
}

export const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekdays at 9:30', value: '30 9 * * 1-5' },
  { label: 'First of month', value: '0 0 1 * *' },
  { label: 'Sundays at noon', value: '0 12 * * 0' },
  { label: 'Every 30 seconds (6 fields)', value: '*/30 * * * * *' },
  { label: 'Every 10 s, weekdays 9–17 (6 fields)', value: '*/10 * 9-17 * * 1-5' },
  { label: 'Quartz: weekdays 09:00 (7 fields)', value: '0 0 9 ? * MON-FRI *' },
  { label: 'Quartz: last day of month 23:30', value: '0 30 23 L * ? *' },
  { label: 'Quartz: 3rd Friday at noon', value: '0 0 12 ? * FRI#3 *' },
  { label: 'Quartz: every 5 min in 2027', value: '0 */5 * * * ? 2027' },
];
