/**
 * JSON helpers. `parseJson` wraps JSON.parse but, on failure, runs a tiny
 * scanner to locate the exact offending position (line / column) because
 * browsers' native error messages are inconsistent about that.
 */

export function locateJsonError(text) {
  let i = 0;
  const n = text.length;
  const fail = (msg) => {
    const err = new Error(msg);
    err.position = i;
    throw err;
  };
  const ws = () => {
    while (i < n && /[ \t\n\r]/.test(text[i])) i++;
  };
  const expect = (ch) => {
    if (text[i] !== ch) fail(`Expected '${ch}' but found ${i < n ? `'${text[i]}'` : 'end of input'}`);
    i++;
  };
  const value = () => {
    ws();
    if (i >= n) fail('Unexpected end of input');
    const c = text[i];
    if (c === '{') return object();
    if (c === '[') return array();
    if (c === '"') return string();
    if (c === 't') return literal('true');
    if (c === 'f') return literal('false');
    if (c === 'n') return literal('null');
    if (c === '-' || (c >= '0' && c <= '9')) return number();
    fail(`Unexpected token '${c}'`);
  };
  const literal = (word) => {
    if (text.substr(i, word.length) !== word) fail(`Unexpected token '${text[i]}'`);
    i += word.length;
  };
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail('Invalid number');
    i += m[0].length;
  };
  const string = () => {
    expect('"');
    while (i < n) {
      const c = text[i];
      if (c === '"') {
        i++;
        return;
      }
      if (c === '\\') {
        i++;
        const e = text[i];
        if ('"\\/bfnrt'.includes(e)) i++;
        else if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.substr(i + 1, 4))) fail('Invalid unicode escape');
          i += 5;
        } else fail(`Invalid escape '\\${e}'`);
      } else if (c === '\n' || c === '\r') {
        fail('Unterminated string (newline in string)');
      } else i++;
    }
    fail('Unterminated string');
  };
  const array = () => {
    expect('[');
    ws();
    if (text[i] === ']') {
      i++;
      return;
    }
    for (;;) {
      value();
      ws();
      if (text[i] === ',') {
        i++;
        ws();
        if (text[i] === ']') fail('Trailing comma in array');
        continue;
      }
      if (text[i] === ']') {
        i++;
        return;
      }
      fail(i < n ? `Expected ',' or ']' but found '${text[i]}'` : "Unexpected end of input, expected ']'");
    }
  };
  const object = () => {
    expect('{');
    ws();
    if (text[i] === '}') {
      i++;
      return;
    }
    for (;;) {
      ws();
      if (text[i] !== '"') fail(i < n ? `Expected string key but found '${text[i]}'` : 'Unexpected end of input');
      string();
      ws();
      expect(':');
      value();
      ws();
      if (text[i] === ',') {
        i++;
        ws();
        if (text[i] === '}') fail('Trailing comma in object');
        continue;
      }
      if (text[i] === '}') {
        i++;
        return;
      }
      fail(i < n ? `Expected ',' or '}' but found '${text[i]}'` : "Unexpected end of input, expected '}'");
    }
  };
  value();
  ws();
  if (i < n) fail(`Unexpected token '${text[i]}' after JSON value`);
}

export function positionToLineCol(text, pos) {
  const before = text.slice(0, pos);
  const lines = before.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function parseJson(text) {
  if (!text || !text.trim()) return { ok: false, empty: true };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    try {
      locateJsonError(text);
      return { ok: false, error: { message: e.message } };
    } catch (loc) {
      const { line, column } = positionToLineCol(text, loc.position ?? 0);
      return { ok: false, error: { message: loc.message, line, column, position: loc.position } };
    }
  }
}

export function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortKeysDeep(value[k]);
        return acc;
      }, {});
  }
  return value;
}

export function formatJson(value, indent = 2, sortKeys = false) {
  const v = sortKeys ? sortKeysDeep(value) : value;
  return JSON.stringify(v, null, indent === 'tab' ? '\t' : Number(indent));
}

export function minifyJson(value) {
  return JSON.stringify(value);
}

export function escapeJsonString(text) {
  return JSON.stringify(text).slice(1, -1);
}

export function unescapeJsonString(text) {
  try {
    return JSON.parse(`"${text}"`);
  } catch {
    return null;
  }
}

export function jsonStats(value) {
  let keys = 0;
  let depth = 0;
  let nodes = 0;
  const walk = (v, d) => {
    nodes++;
    depth = Math.max(depth, d);
    if (Array.isArray(v)) v.forEach((x) => walk(x, d + 1));
    else if (v && typeof v === 'object') {
      keys += Object.keys(v).length;
      Object.values(v).forEach((x) => walk(x, d + 1));
    }
  };
  walk(value, 1);
  return { keys, depth, nodes };
}

export const SAMPLE_JSON = `{
  "id": 1024,
  "name": "DevKit",
  "active": true,
  "tags": ["json", "tools", "offline"],
  "owner": { "name": "Priya", "email": "priya@example.com", "roles": ["admin", "dev"] },
  "releases": [
    { "version": "0.1.0", "date": "2026-08-20T09:30:00Z", "notes": null },
    { "version": "0.2.0", "date": "2026-09-01T10:00:00Z", "notes": "Adds themes" }
  ],
  "score": 98.5
}`;
