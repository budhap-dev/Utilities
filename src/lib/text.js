export function splitWords(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

export const CASES = [
  { id: 'camel', label: 'camelCase', fn: (t) => splitWords(t).map((w, i) => (i ? cap(w) : w.toLowerCase())).join('') },
  { id: 'pascal', label: 'PascalCase', fn: (t) => splitWords(t).map(cap).join('') },
  { id: 'snake', label: 'snake_case', fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join('_') },
  { id: 'constant', label: 'CONSTANT_CASE', fn: (t) => splitWords(t).map((w) => w.toUpperCase()).join('_') },
  { id: 'kebab', label: 'kebab-case', fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join('-') },
  { id: 'dot', label: 'dot.case', fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join('.') },
  { id: 'title', label: 'Title Case', fn: (t) => splitWords(t).map(cap).join(' ') },
  { id: 'sentence', label: 'Sentence case', fn: (t) => { const w = splitWords(t).map((x) => x.toLowerCase()); if (w.length) w[0] = cap(w[0]); return w.join(' '); } },
  { id: 'upper', label: 'UPPER CASE', fn: (t) => t.toUpperCase() },
  { id: 'lower', label: 'lower case', fn: (t) => t.toLowerCase() },
];

export function textStats(text) {
  const lines = text ? text.split('\n').length : 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const bytes = new TextEncoder().encode(text).length;
  const sentences = text.trim() ? (text.match(/[.!?]+(\s|$)/g) || []).length : 0;
  return { lines, words, chars, charsNoSpace, bytes, sentences };
}

export const LINE_OPS = [
  { id: 'sort-asc', label: 'Sort A→Z', fn: (ls) => [...ls].sort((a, b) => a.localeCompare(b)) },
  { id: 'sort-desc', label: 'Sort Z→A', fn: (ls) => [...ls].sort((a, b) => b.localeCompare(a)) },
  { id: 'sort-num', label: 'Sort numeric', fn: (ls) => [...ls].sort((a, b) => parseFloat(a) - parseFloat(b)) },
  { id: 'sort-len', label: 'Sort by length', fn: (ls) => [...ls].sort((a, b) => a.length - b.length) },
  { id: 'dedupe', label: 'Remove duplicates', fn: (ls) => [...new Set(ls)] },
  { id: 'reverse', label: 'Reverse order', fn: (ls) => [...ls].reverse() },
  { id: 'trim', label: 'Trim lines', fn: (ls) => ls.map((l) => l.trim()) },
  { id: 'no-empty', label: 'Remove empty lines', fn: (ls) => ls.filter((l) => l.trim()) },
  { id: 'shuffle', label: 'Shuffle', fn: (ls) => { const a = [...ls]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } },
  { id: 'number', label: 'Number lines', fn: (ls) => ls.map((l, i) => `${i + 1}. ${l}`) },
];

const LOREM_WORDS = (
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ' +
  'ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure ' +
  'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non ' +
  'proident sunt in culpa qui officia deserunt mollit anim id est laborum'
).split(' ');

export function loremIpsum(paragraphs = 3, sentencesPer = 4) {
  const out = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let p = 0; p < paragraphs; p++) {
    const sentences = [];
    for (let s = 0; s < sentencesPer; s++) {
      const len = 8 + Math.floor(rnd() * 10);
      const words = [];
      for (let w = 0; w < len; w++) words.push(LOREM_WORDS[Math.floor(rnd() * LOREM_WORDS.length)]);
      sentences.push(cap(words.join(' ')) + '.');
    }
    out.push(sentences.join(' '));
  }
  if (paragraphs > 0) out[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + out[0];
  return out.join('\n\n');
}
