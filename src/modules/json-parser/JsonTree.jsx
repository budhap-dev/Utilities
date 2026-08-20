import { useState } from 'react';
import useClipboard from '../../hooks/useClipboard';

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function Leaf({ value }) {
  const t = typeOf(value);
  if (t === 'string') return <span className="jtree__string">"{value}"</span>;
  if (t === 'number') return <span className="jtree__number">{String(value)}</span>;
  if (t === 'boolean') return <span className="jtree__boolean">{String(value)}</span>;
  return <span className="jtree__null">null</span>;
}

function Node({ name, value, path, depth, defaultOpen }) {
  const t = typeOf(value);
  const isContainer = t === 'object' || t === 'array';
  const [open, setOpen] = useState(defaultOpen);
  const copy = useClipboard();
  const entries = isContainer ? (t === 'array' ? value.map((v, i) => [i, v]) : Object.entries(value)) : [];
  const count = entries.length;

  return (
    <div>
      <div className="jtree__row">
        <button
          type="button"
          className={`jtree__toggle${isContainer ? '' : ' jtree__toggle--leaf'}`}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▼' : '▶'}
        </button>
        {name !== undefined && (
          <>
            <span className="jtree__key">{typeof name === 'number' ? name : `"${name}"`}</span>
            <span className="jtree__punct">:</span>
          </>
        )}
        {isContainer ? (
          <>
            <span className="jtree__punct">{t === 'array' ? '[' : '{'}</span>
            {!open && <span className="jtree__meta">{count} {t === 'array' ? 'items' : 'keys'}</span>}
            {!open && <span className="jtree__punct">{t === 'array' ? ']' : '}'}</span>}
          </>
        ) : (
          <Leaf value={value} />
        )}
        <button type="button" className="jtree__copy" onClick={() => copy(path || '$', `Copied path ${path || '$'}`)} title="Copy path">
          {path || '$'}
        </button>
      </div>
      {isContainer && open && (
        <div className="jtree__children">
          {entries.map(([k, v]) => (
            <Node
              key={k}
              name={k}
              value={v}
              depth={depth + 1}
              defaultOpen={depth < 1}
              path={t === 'array' ? `${path}[${k}]` : /^[A-Za-z_$][\w$]*$/.test(k) ? `${path}.${k}` : `${path}["${k}"]`}
            />
          ))}
          <div className="jtree__row">
            <span className="jtree__toggle jtree__toggle--leaf" />
            <span className="jtree__punct">{t === 'array' ? ']' : '}'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JsonTree({ value }) {
  return (
    <div className="jtree">
      <Node value={value} path="$" depth={0} defaultOpen />
    </div>
  );
}
