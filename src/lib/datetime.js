import { formatInTimeZone } from 'date-fns-tz';
import { formatDistanceToNow, getISOWeek, getDayOfYear } from 'date-fns';

export function listTimeZones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
  }
}

export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Parse free-form input into a Date.
 * Accepts: epoch seconds / milliseconds / microseconds / nanoseconds, ISO 8601,
 * RFC 2822, "now", and anything Date.parse understands.
 */
export function parseDateInput(input, epochUnit = 'auto') {
  const s = (input || '').trim();
  if (!s) return { ok: false, empty: true };
  if (/^now$/i.test(s)) return { ok: true, date: new Date(), kind: 'now' };
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const num = Number(s);
    let ms;
    let unit = epochUnit;
    if (unit === 'auto') {
      const abs = Math.abs(num);
      if (abs < 1e11) unit = 's';
      else if (abs < 1e14) unit = 'ms';
      else if (abs < 1e17) unit = 'us';
      else unit = 'ns';
    }
    if (unit === 's') ms = num * 1000;
    else if (unit === 'ms') ms = num;
    else if (unit === 'us') ms = num / 1000;
    else ms = num / 1e6;
    const date = new Date(ms);
    if (isNaN(date)) return { ok: false, error: 'Epoch value out of range' };
    return { ok: true, date, kind: `epoch (${unit})` };
  }
  const t = Date.parse(s);
  if (!isNaN(t)) return { ok: true, date: new Date(t), kind: 'date string' };
  return { ok: false, error: 'Could not parse input as a date' };
}

export function describeDate(date, tz) {
  const ms = date.getTime();
  const safe = (fn) => {
    try {
      return fn();
    } catch {
      return '';
    }
  };
  return {
    epochSeconds: String(Math.floor(ms / 1000)),
    epochMillis: String(ms),
    isoUtc: date.toISOString(),
    isoTz: safe(() => formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")),
    rfc2822: safe(() => formatInTimeZone(date, tz, 'EEE, dd MMM yyyy HH:mm:ss xx')),
    human: safe(() => formatInTimeZone(date, tz, 'EEEE, d MMMM yyyy HH:mm:ss zzz')),
    dateOnly: safe(() => formatInTimeZone(date, tz, 'yyyy-MM-dd')),
    timeOnly: safe(() => formatInTimeZone(date, tz, 'HH:mm:ss')),
    relative: formatDistanceToNow(date, { addSuffix: true }),
    isoWeek: String(getISOWeek(date)),
    dayOfYear: String(getDayOfYear(date)),
    utcString: date.toUTCString(),
    localeString: date.toLocaleString(),
  };
}

export function formatInZone(date, tz) {
  try {
    return formatInTimeZone(date, tz, 'yyyy-MM-dd HH:mm:ss (zzz)');
  } catch {
    return '';
  }
}

export const COMMON_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];
