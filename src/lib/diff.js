import { diffLines, diffWordsWithSpace } from 'diff';

function normalise(text, { ignoreWhitespace, ignoreCase }) {
  let t = text;
  if (ignoreCase) t = t.toLowerCase();
  if (ignoreWhitespace)
    t = t
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .join('\n');
  // Normalise the trailing newline so the last line compares like any other.
  if (t && !t.endsWith('\n')) t += '\n';
  return t;
}

function splitLines(text) {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Inline (word-level) segments for a modified line pair. */
function inlineSegments(a, b) {
  const parts = diffWordsWithSpace(a, b);
  const left = [];
  const right = [];
  parts.forEach((p) => {
    if (p.added) right.push({ text: p.value, type: 'add' });
    else if (p.removed) left.push({ text: p.value, type: 'del' });
    else {
      left.push({ text: p.value });
      right.push({ text: p.value });
    }
  });
  return { left, right };
}

/**
 * Compute a line diff and return rows suitable for side-by-side or unified
 * rendering. Each row: { type: 'eq'|'add'|'del'|'mod', left?, right? } where
 * left/right = { n: lineNumber, text, segments? }.
 */
export function computeDiff(original, modified, opts = {}) {
  const a = normalise(original, opts);
  const b = normalise(modified, opts);
  const parts = diffLines(a, b);
  const rows = [];
  let ln = 1;
  let rn = 1;
  let added = 0;
  let removed = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const lines = splitLines(part.value);
    if (part.removed) {
      const next = parts[i + 1];
      if (next && next.added) {
        // Pair removed/added blocks line by line for inline highlighting
        const addLines = splitLines(next.value);
        const max = Math.max(lines.length, addLines.length);
        for (let k = 0; k < max; k++) {
          const l = lines[k];
          const r = addLines[k];
          if (l !== undefined && r !== undefined) {
            const seg = inlineSegments(l, r);
            rows.push({ type: 'mod', left: { n: ln++, text: l, segments: seg.left }, right: { n: rn++, text: r, segments: seg.right } });
            added++;
            removed++;
          } else if (l !== undefined) {
            rows.push({ type: 'del', left: { n: ln++, text: l } });
            removed++;
          } else {
            rows.push({ type: 'add', right: { n: rn++, text: r } });
            added++;
          }
        }
        i++; // consumed the added part
      } else {
        lines.forEach((l) => {
          rows.push({ type: 'del', left: { n: ln++, text: l } });
          removed++;
        });
      }
    } else if (part.added) {
      lines.forEach((l) => {
        rows.push({ type: 'add', right: { n: rn++, text: l } });
        added++;
      });
    } else {
      lines.forEach((l) => {
        rows.push({ type: 'eq', left: { n: ln++, text: l }, right: { n: rn++, text: l } });
      });
    }
  }
  return { rows, added, removed, identical: added === 0 && removed === 0 };
}

export const SAMPLE_A = `{
  "name": "devkit",
  "version": "0.1.0",
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`;

export const SAMPLE_B = `{
  "name": "devkit",
  "version": "0.2.0",
  "scripts": {
    "start": "webpack serve --open",
    "build": "webpack --mode production",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "diff": "^5.2.0"
  }
}`;
