const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const NAMED = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00',
  cyan: '#00ffff', magenta: '#ff00ff', gray: '#808080', grey: '#808080', orange: '#ffa500', purple: '#800080',
  pink: '#ffc0cb', brown: '#a52a2a', navy: '#000080', teal: '#008080', olive: '#808000', maroon: '#800000',
  lime: '#00ff00', silver: '#c0c0c0', gold: '#ffd700', coral: '#ff7f50', salmon: '#fa8072', tomato: '#ff6347',
  indigo: '#4b0082', violet: '#ee82ee', turquoise: '#40e0d0', crimson: '#dc143c', khaki: '#f0e68c',
};

/** Parse hex / rgb() / hsl() / named colour → { r,g,b,a } or null */
export function parseColor(input) {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  let m;
  if ((m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s))) {
    let h = m[1];
    if (h.length <= 4) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  if ((m = /^rgba?\(\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/.exec(s))) {
    const pct = s.includes('%') && !/[,/]\s*[\d.]+%\s*\)$/.test(s) ? 2.55 : 1;
    let a = 1;
    if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: clamp(Math.round(+m[1] * pct), 0, 255), g: clamp(Math.round(+m[2] * pct), 0, 255), b: clamp(Math.round(+m[3] * pct), 0, 255), a: clamp(a, 0, 1) };
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/.exec(s))) {
    let a = 1;
    if (m[4] !== undefined) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { ...hslToRgb(+m[1], +m[2], +m[3]), a: clamp(a, 0, 1) };
  }
  return null;
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hex2 = (n) => n.toString(16).padStart(2, '0');

export function toHex({ r, g, b, a = 1 }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(Math.round(a * 255)) : ''}`;
}
export function toRgbString({ r, g, b, a = 1 }) {
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})` : `rgb(${r}, ${g}, ${b})`;
}
export function toHslString(c) {
  const { h, s, l } = rgbToHsl(c);
  return c.a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${+c.a.toFixed(3)})` : `hsl(${h}, ${s}%, ${l}%)`;
}

export function luminance({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function wcagLevels(ratio) {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}
