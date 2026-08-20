const FIELD_DEFS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] },
  { name: 'day of week', min: 0, max: 7, names: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
];

const ALIASES = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

function parseField(raw, def) {
  const set = new Set();
  const any = raw === '*' || raw === '?';
  const toNum = (tok) => {
    const t = tok.toLowerCase();
    if (def.names) {
      const idx = def.names.indexOf(t);
      if (idx >= 0) return def.min === 1 ? idx + 1 : idx;
    }
    if (!/^\d+$/.test(t)) throw new Error(`Invalid value "${tok}" in ${def.name} field`);
    return parseInt(t, 10);
  };
  raw.split(',').forEach((part) => {
    let [range, stepStr] = part.split('/');
    const step = stepStr !== undefined ? parseInt(stepStr, 10) : 1;
    if (stepStr !== undefined && (!/^\d+$/.test(stepStr) || step < 1)) throw new Error(`Invalid step "/${stepStr}" in ${def.name} field`);
    let lo;
    let hi;
    if (range === '*' || range === '?') {
      lo = def.min;
      hi = def.max;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      lo = toNum(a);
      hi = toNum(b);
    } else {
      lo = toNum(range);
      hi = stepStr !== undefined ? def.max : lo;
    }
    if (lo < def.min || hi > def.max || lo > hi) throw new Error(`Value out of range in ${def.name} field (${def.min}–${def.max})`);
    for (let v = lo; v <= hi; v += step) set.add(v);
  });
  // Sunday may be 0 or 7
  if (def.name === 'day of week' && set.has(7)) set.add(0);
  return { set, any };
}

export function parseCron(expr) {
  let e = (expr || '').trim();
  if (!e) throw new Error('Empty expression');
  if (ALIASES[e.toLowerCase()]) e = ALIASES[e.toLowerCase()];
  const fields = e.split(/\s+/);
  if (fields.length !== 5) throw new Error(`Expected 5 fields (minute hour day month weekday), got ${fields.length}`);
  return fields.map((f, i) => ({ raw: f, ...FIELD_DEFS[i], ...parseField(f, FIELD_DEFS[i]) }));
}

/** Compute the next `count` run times after `from` (Date). Uses local time. */
export function nextRuns(expr, count = 5, from = new Date()) {
  const [min, hour, dom, mon, dow] = parseCron(expr);
  const out = [];
  const d = new Date(from.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  let guard = 0;
  const dayMatches = (date) => {
    const domOk = dom.set.has(date.getDate());
    const dowOk = dow.set.has(date.getDay());
    if (dom.any && dow.any) return true;
    if (dom.any) return dowOk;
    if (dow.any) return domOk;
    return domOk || dowOk; // standard cron: OR when both restricted
  };
  while (out.length < count && guard++ < 200000) {
    if (!mon.set.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!dayMatches(d)) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!hour.set.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0, 0);
      continue;
    }
    if (!min.set.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1, 0, 0);
      continue;
    }
    out.push(new Date(d.getTime()));
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

export const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekdays at 9:30', value: '30 9 * * 1-5' },
  { label: 'First of month', value: '0 0 1 * *' },
  { label: 'Sundays at noon', value: '0 12 * * 0' },
];
