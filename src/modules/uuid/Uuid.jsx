import { useCallback, useEffect, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, CodeOutput, CopyButton, Button, Select, Checkbox, Toolbar, Stats } from '../../components/ui';

const NANO_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

function uuidv4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function nanoid(size = 21) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = '';
  for (let i = 0; i < size; i++) id += NANO_ALPHABET[bytes[i] & 63];
  return id;
}

function shortId(size = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = '';
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

export default function Uuid() {
  const [kind, setKind] = useLocalStorage('uuid.kind', 'v4');
  const [count, setCount] = useLocalStorage('uuid.count', 5);
  const [upper, setUpper] = useLocalStorage('uuid.upper', false);
  const [hyphens, setHyphens] = useLocalStorage('uuid.hyphens', true);
  const [nanoSize, setNanoSize] = useLocalStorage('uuid.nanoSize', 21);
  const [ids, setIds] = useState([]);

  const generate = useCallback(() => {
    const n = Math.min(Math.max(1, Number(count) || 1), 1000);
    const out = [];
    for (let i = 0; i < n; i++) {
      let id = kind === 'v4' ? uuidv4() : kind === 'nano' ? nanoid(Number(nanoSize) || 21) : shortId();
      if (kind === 'v4' && !hyphens) id = id.replace(/-/g, '');
      if (upper) id = id.toUpperCase();
      out.push(id);
    }
    setIds(out);
  }, [kind, count, upper, hyphens, nanoSize]);

  useEffect(() => {
    generate();
  }, [generate]);

  const text = ids.join('\n');

  return (
    <div className="tool">
      <Toolbar>
        <Select options={[{ value: 'v4', label: 'UUID v4' }, { value: 'nano', label: 'NanoID' }, { value: 'short', label: 'Short ID (8 chars)' }]} value={kind} onChange={setKind} />
        <label className="row" style={{ gap: 6 }}>
          <span className="muted">Count</span>
          <input className="input" type="number" min={1} max={1000} value={count} onChange={(e) => setCount(e.target.value)} style={{ width: 80 }} />
        </label>
        {kind === 'nano' && (
          <label className="row" style={{ gap: 6 }}>
            <span className="muted">Length</span>
            <input className="input" type="number" min={4} max={64} value={nanoSize} onChange={(e) => setNanoSize(e.target.value)} style={{ width: 80 }} />
          </label>
        )}
        {kind === 'v4' && <Checkbox checked={hyphens} onChange={setHyphens}>Hyphens</Checkbox>}
        <Checkbox checked={upper} onChange={setUpper}>Uppercase</Checkbox>
        <span className="toolbar__spacer" />
        <Button variant="primary" onClick={generate}>Regenerate</Button>
      </Toolbar>
      <Panel title="Generated IDs" className="grow" actions={<CopyButton text={text} label="Copy all" />} footer={<Stats items={[['IDs', ids.length], ['Source', 'crypto.getRandomValues']]} />}>
        <CodeOutput value={text} />
      </Panel>
    </div>
  );
}
