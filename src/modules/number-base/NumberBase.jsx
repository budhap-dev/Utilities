import { useState } from 'react';
import { Panel, KV, Alert, Button, Toolbar, Checkbox } from '../../components/ui';
import useLocalStorage from '../../hooks/useLocalStorage';

const BASES = [
  { id: 'dec', label: 'Decimal', radix: 10, re: /^-?\d+$/ },
  { id: 'bin', label: 'Binary', radix: 2, re: /^-?[01]+$/, prefix: '0b' },
  { id: 'oct', label: 'Octal', radix: 8, re: /^-?[0-7]+$/, prefix: '0o' },
  { id: 'hex', label: 'Hexadecimal', radix: 16, re: /^-?[0-9a-fA-F]+$/, prefix: '0x' },
];

function parseBig(str, radix) {
  let s = str.trim().replace(/[\s_]/g, '');
  if (!s) return null;
  let neg = false;
  if (s.startsWith('-')) {
    neg = true;
    s = s.slice(1);
  }
  s = s.replace(/^0[bBoOxX]/, '');
  const base = BASES.find((b) => b.radix === radix);
  if (!base.re.test(s)) throw new Error(`"${str}" is not a valid ${base.label.toLowerCase()} number`);
  let v = 0n;
  const big = BigInt(radix);
  for (const ch of s.toLowerCase()) v = v * big + BigInt(parseInt(ch, radix));
  return neg ? -v : v;
}

function group(str, size, sep = ' ') {
  const neg = str.startsWith('-');
  const body = neg ? str.slice(1) : str;
  const out = [];
  for (let i = body.length; i > 0; i -= size) out.unshift(body.slice(Math.max(0, i - size), i));
  return (neg ? '-' : '') + out.join(sep);
}

export default function NumberBase() {
  const [fields, setFields] = useState({ dec: '', bin: '', oct: '', hex: '' });
  const [error, setError] = useState('');
  const [grouped, setGrouped] = useLocalStorage('numbase.grouped', true);
  const [value, setValue] = useState(null);

  const update = (id, text) => {
    const base = BASES.find((b) => b.id === id);
    setFields((f) => ({ ...f, [id]: text }));
    try {
      const v = parseBig(text, base.radix);
      setError('');
      setValue(v);
      if (v === null) {
        setFields({ dec: '', bin: '', oct: '', hex: '' });
        return;
      }
      setFields(
        Object.fromEntries(BASES.map((b) => [b.id, b.id === id ? text : (grouped ? group(v.toString(b.radix), b.radix === 2 ? 4 : b.radix === 16 ? 4 : 3) : v.toString(b.radix))]))
      );
    } catch (e) {
      setError(e.message);
      setValue(null);
    }
  };

  const bits = value !== null ? (value < 0n ? -value : value).toString(2).length : 0;
  const twos32 = value !== null && value < 0n && -value <= 2n ** 31n ? (2n ** 32n + value).toString(2).padStart(32, '0') : null;
  const twos64 = value !== null && value < 0n && -value <= 2n ** 63n ? (2n ** 64n + value).toString(16).padStart(16, '0') : null;

  return (
    <div className="tool">
      <Toolbar>
        <Checkbox checked={grouped} onChange={setGrouped}>Group digits</Checkbox>
        <span className="toolbar__spacer" />
        <Button size="sm" onClick={() => update('dec', '3735928559')}>Sample</Button>
        <Button size="sm" variant="ghost" onClick={() => { setFields({ dec: '', bin: '', oct: '', hex: '' }); setError(''); setValue(null); }}>Clear</Button>
      </Toolbar>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="tool__grid" style={{ minHeight: 0 }}>
        <Panel title="Bases (edit any field)" padded>
          <div className="stack">
            {BASES.map((b) => (
              <div className="field" key={b.id}>
                <label>{b.label} {b.prefix && <span className="faint mono">({b.prefix})</span>}</label>
                <input className="input mono input--full" value={fields[b.id]} onChange={(e) => update(b.id, e.target.value)} placeholder={`Enter a ${b.label.toLowerCase()} number`} spellCheck={false} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Details" padded>
          {value === null ? (
            <div className="empty-state">Type a number in any base. Arbitrary precision via BigInt — 64-bit and beyond are fine.</div>
          ) : (
            <div className="kv">
              <KV label="Bits required" value={String(bits)} copyable={false} />
              <KV label="Fits in" value={bits <= 8 ? 'int8 / uint8' : bits <= 16 ? 'int16 / uint16' : bits <= 32 ? 'int32 / uint32' : bits <= 64 ? 'int64 / uint64' : `> 64-bit (${bits} bits)`} copyable={false} />
              <KV label="Hex with prefix" value={'0x' + (value < 0n ? '-' + (-value).toString(16) : value.toString(16)).toUpperCase()} />
              <KV label="Binary with prefix" value={'0b' + value.toString(2)} />
              <KV label="Octal with prefix" value={'0o' + value.toString(8)} />
              <KV label="Base 36" value={value.toString(36)} />
              <KV label="Locale string" value={value.toLocaleString()} />
              {twos32 && <KV label="Two's complement (32-bit)" value={twos32} />}
              {twos64 && <KV label="Two's complement (64-bit hex)" value={'0x' + twos64} />}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
