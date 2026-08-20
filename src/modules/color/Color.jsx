import { useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, KV, Badge, Alert, Toolbar, Button } from '../../components/ui';
import { parseColor, toHex, toRgbString, toHslString, rgbToHsl, contrastRatio, wcagLevels } from '../../lib/color';

const PALETTE = ['#4f6bed', '#1f9d55', '#d7373f', '#c77700', '#8250df', '#0ea5e9', '#111827', '#f5f6f8'];

function Pass({ ok }) {
  return <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Pass' : 'Fail'}</Badge>;
}

export default function Color() {
  const [fg, setFg] = useLocalStorage('color.fg', '#4f6bed');
  const [bg, setBg] = useLocalStorage('color.bg', '#ffffff');
  const c = useMemo(() => parseColor(fg), [fg]);
  const b = useMemo(() => parseColor(bg), [bg]);
  const ratio = c && b ? contrastRatio(c, b) : null;
  const levels = ratio ? wcagLevels(ratio) : null;
  const hsl = c ? rgbToHsl(c) : null;

  return (
    <div className="tool">
      <Toolbar>
        <input className="input mono" style={{ width: 260 }} value={fg} onChange={(e) => setFg(e.target.value)} placeholder="#4f6bed, rgb(79,107,237), hsl(229,82%,62%), navy…" />
        <input type="color" value={c ? toHex({ ...c, a: 1 }) : '#000000'} onChange={(e) => setFg(e.target.value)} style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Pick colour" />
        {PALETTE.map((p) => (
          <button key={p} type="button" onClick={() => setFg(p)} title={p} style={{ width: 22, height: 22, borderRadius: 6, background: p, border: '1px solid var(--border)' }} aria-label={`Use ${p}`} />
        ))}
        <span className="toolbar__spacer" />
        <Button size="sm" onClick={() => { setFg(bg); setBg(fg); }}>Swap fg / bg</Button>
      </Toolbar>
      {!c && fg && <Alert tone="danger">Could not parse “{fg}” as a colour.</Alert>}
      <div className="tool__grid" style={{ minHeight: 0 }}>
        <Panel title="Colour" padded>
          <div className="swatch" style={{ background: c ? toRgbString(c) : 'transparent', marginBottom: 16 }} />
          {c && (
            <div className="kv">
              <KV label="HEX" value={toHex(c)} />
              <KV label="RGB" value={toRgbString(c)} />
              <KV label="HSL" value={toHslString(c)} />
              <KV label="RGB (0–1)" value={`${(c.r / 255).toFixed(3)}, ${(c.g / 255).toFixed(3)}, ${(c.b / 255).toFixed(3)}`} />
              <KV label="Hue / Sat / Light" value={`${hsl.h}° / ${hsl.s}% / ${hsl.l}%`} />
              <KV label="CSS variable" value={`--color: ${toHex(c)};`} />
            </div>
          )}
        </Panel>
        <Panel title="Contrast checker (WCAG 2.1)" padded>
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="muted">Background</span>
            <input className="input mono" style={{ width: 180 }} value={bg} onChange={(e) => setBg(e.target.value)} />
            <input type="color" value={b ? toHex({ ...b, a: 1 }) : '#ffffff'} onChange={(e) => setBg(e.target.value)} style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Pick background" />
          </div>
          {c && b && (
            <>
              <div className="contrast-sample" style={{ background: toRgbString(b), color: toRgbString(c), marginBottom: 12 }}>
                <div style={{ fontSize: 14 }}>Normal text — The quick brown fox jumps over the lazy dog.</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>Large text — Aa Bb Cc 123</div>
              </div>
              <div className="row" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>{ratio.toFixed(2)}:1</span>
                <span className="muted">contrast ratio</span>
              </div>
              <table className="table">
                <thead><tr><th>Level</th><th>Normal text</th><th>Large text (≥18pt / 14pt bold)</th></tr></thead>
                <tbody>
                  <tr><td>AA</td><td><Pass ok={levels.aaNormal} /> <span className="faint">≥ 4.5</span></td><td><Pass ok={levels.aaLarge} /> <span className="faint">≥ 3</span></td></tr>
                  <tr><td>AAA</td><td><Pass ok={levels.aaaNormal} /> <span className="faint">≥ 7</span></td><td><Pass ok={levels.aaaLarge} /> <span className="faint">≥ 4.5</span></td></tr>
                </tbody>
              </table>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
