import { lazy } from 'react';
import * as I from './components/Icons';

/**
 * Single source of truth for every tool in DevKit.
 * The sidebar, home page, command palette and router are all driven from this list.
 */
export const TOOLS = [
  // --- JSON ---
  {
    id: 'json-parser',
    name: 'JSON Parser',
    group: 'JSON',
    description: 'Validate JSON, pinpoint errors, explore as a tree.',
    icon: I.Braces,
    keywords: ['validate', 'tree', 'viewer', 'path'],
    component: lazy(() => import('./modules/json-parser/JsonParser')),
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    group: 'JSON',
    description: 'Pretty-print, minify, sort keys, escape / unescape.',
    icon: I.AlignLeft,
    keywords: ['beautify', 'prettify', 'minify', 'compact', 'sort'],
    component: lazy(() => import('./modules/json-formatter/JsonFormatter')),
  },
  // --- Date & time ---
  {
    id: 'datetime',
    name: 'Date & Time Converter',
    group: 'Date & Time',
    description: 'Epoch ↔ ISO ↔ local, any timezone, relative time.',
    icon: I.Clock,
    keywords: ['epoch', 'unix', 'timestamp', 'iso', 'timezone', 'utc'],
    component: lazy(() => import('./modules/datetime/DateTime')),
  },
  {
    id: 'cron',
    name: 'Cron Parser',
    group: 'Date & Time',
    description: 'Explain a cron expression and list the next runs.',
    icon: I.Calendar,
    keywords: ['schedule', 'crontab', 'expression'],
    component: lazy(() => import('./modules/cron/Cron')),
  },
  // --- Text & files ---
  {
    id: 'diff',
    name: 'File / Text Comparer',
    group: 'Text & Files',
    description: 'Side-by-side or unified diff of two texts or files.',
    icon: I.Diff,
    keywords: ['compare', 'difference', 'merge', 'file'],
    component: lazy(() => import('./modules/diff/TextDiff')),
  },
  {
    id: 'text-utils',
    name: 'Text Utilities',
    group: 'Text & Files',
    description: 'Case conversion, sort / dedupe lines, counts, lorem ipsum.',
    icon: I.Type,
    keywords: ['case', 'camel', 'snake', 'kebab', 'sort', 'dedupe', 'count', 'lorem'],
    component: lazy(() => import('./modules/text-utils/TextUtils')),
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    group: 'Text & Files',
    description: 'Live matches, groups, flags and a cheatsheet.',
    icon: I.Regex,
    keywords: ['regular expression', 'pattern', 'match'],
    component: lazy(() => import('./modules/regex/Regex')),
  },
  // --- Encoding ---
  {
    id: 'base64',
    name: 'Base64',
    group: 'Encoding',
    description: 'Encode / decode Base64 and URL-safe Base64 (UTF-8 aware).',
    icon: I.Binary,
    keywords: ['encode', 'decode', 'b64', 'data uri'],
    component: lazy(() => import('./modules/base64/Base64')),
  },
  {
    id: 'url',
    name: 'URL Encoder',
    group: 'Encoding',
    description: 'Encode / decode URLs and break down query strings.',
    icon: I.Link,
    keywords: ['uri', 'percent', 'query', 'params'],
    component: lazy(() => import('./modules/url/Url')),
  },
  {
    id: 'number-base',
    name: 'Number Base Converter',
    group: 'Encoding',
    description: 'Decimal ↔ binary ↔ octal ↔ hex with BigInt support.',
    icon: I.Calculator,
    keywords: ['binary', 'hex', 'octal', 'radix'],
    component: lazy(() => import('./modules/number-base/NumberBase')),
  },
  // --- Security ---
  {
    id: 'jwt',
    name: 'JWT Decoder',
    group: 'Security',
    description: 'Decode header & payload, check expiry — offline.',
    icon: I.Key,
    keywords: ['token', 'jwt', 'bearer', 'claims'],
    component: lazy(() => import('./modules/jwt/Jwt')),
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    group: 'Security',
    description: 'SHA-1 / 256 / 384 / 512 of text or files.',
    icon: I.Hash,
    keywords: ['sha', 'checksum', 'digest'],
    component: lazy(() => import('./modules/hash/Hash')),
  },
  // --- Generators ---
  {
    id: 'uuid',
    name: 'UUID Generator',
    group: 'Generators',
    description: 'Bulk UUID v4 and NanoID generation.',
    icon: I.Fingerprint,
    keywords: ['guid', 'id', 'nanoid', 'random'],
    component: lazy(() => import('./modules/uuid/Uuid')),
  },
  {
    id: 'color',
    name: 'Colour Converter',
    group: 'Generators',
    description: 'HEX ↔ RGB ↔ HSL, swatches and WCAG contrast.',
    icon: I.Palette,
    keywords: ['color', 'hex', 'rgb', 'hsl', 'contrast', 'wcag'],
    component: lazy(() => import('./modules/color/Color')),
  },
];

export const GROUPS = [...new Set(TOOLS.map((t) => t.group))];

export function getTool(id) {
  return TOOLS.find((t) => t.id === id);
}

export function searchTools(query) {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) => {
    const hay = [t.name, t.group, t.description, ...(t.keywords || [])].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  });
}
