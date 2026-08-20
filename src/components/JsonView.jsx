import { useMemo, useState } from 'react';
import { Button } from './ui';

/**
 * Prettified, syntax-highlighted JSON that keeps real JSON layout
 * (brackets, commas, indentation) and adds +/− collapse buttons on every
 * object / array node.
 *
 * Props:
 *  - value: parsed JSON value
 *  - indent: number of spaces per level (default 2)
 *  - sortKeys: boolean
 *  - defaultExpandDepth: levels expanded initially (Infinity = all)
 *  - toolbar: render Expand/Collapse controls above the view (default true)
 */

const isContainer = (v) => v !== null && typeof v === 'object';

function Leaf({ value }) {
  if (typeof value === 'string') return <span className="jtree__string">"{value}"</span>;
  if (typeof value === 'number') return <span className="jtree__number">{String(value)}</span>;
  if (typeof value === 'boolean') return <span className="jtree__boolean">{String(value)}</span>;
  return <span className="jtree__null">null</span>;
}

function Toggle({ open, onClick, hidden }) {
  if (hidden) return <span className="jview__toggle jview__toggle--hidden" />;
  return (
    <button type="button" className="jview__toggle" onClick={onClick} aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open}>
      {open ? '−' : '+'}
    </button>
  );
}

function Node({ name, value, isLast, depth, indent, sortKeys, expandDepth }) {
  const container = isContainer(value);
  const [open, setOpen] = useState(depth < expandDepth);
  const isArray = Array.isArray(value);
  const entries = useMemo(() => {
    if (!container) return [];
    if (isArray) return value.map((v, i) => [i, v]);
    const keys = Object.keys(value);
    if (sortKeys) keys.sort();
    return keys.map((k) => [k, value[k]]);
  }, [value, container, isArray, sortKeys]);

  const pad = { paddingLeft: depth * indent * 8 };
  const comma = isLast ? '' : ',';
  const keyEl = name !== undefined && !Number.isInteger(name) ? (
    <>
      <span className="jtree__key">"{name}"</span>
      <span className="jtree__punct">: </span>
    </>
  ) : null;

  if (!container) {
    return (
      <div className="jview__line" style={pad}>
        <Toggle hidden />
        {keyEl}
        <Leaf value={value} />
        <span className="jtree__punct">{comma}</span>
      </div>
    );
  }

  const [openB, closeB] = isArray ? ['[', ']'] : ['{', '}'];
  const count = entries.length;

  if (count === 0) {
    return (
      <div className="jview__line" style={pad}>
        <Toggle hidden />
        {keyEl}
        <span className="jtree__punct">{openB}{closeB}{comma}</span>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="jview__line jview__line--collapsed" style={pad} onDoubleClick={() => setOpen(true)}>
        <Toggle open={false} onClick={() => setOpen(true)} />
        {keyEl}
        <span className="jtree__punct">{openB}</span>
        <span className="jview__summary"> … {count} {isArray ? (count === 1 ? 'item' : 'items') : count === 1 ? 'key' : 'keys'} </span>
        <span className="jtree__punct">{closeB}{comma}</span>
      </div>
    );
  }

  return (
    <>
      <div className="jview__line" style={pad}>
        <Toggle open onClick={() => setOpen(false)} />
        {keyEl}
        <span className="jtree__punct">{openB}</span>
      </div>
      {entries.map(([k, v], i) => (
        <Node key={k} name={k} value={v} isLast={i === count - 1} depth={depth + 1} indent={indent} sortKeys={sortKeys} expandDepth={expandDepth} />
      ))}
      <div className="jview__line" style={pad}>
        <Toggle hidden />
        <span className="jtree__punct">{closeB}{comma}</span>
      </div>
    </>
  );
}

export default function JsonView({ value, indent = 2, sortKeys = false, defaultExpandDepth = Infinity, toolbar = true }) {
  // Changing expandDepth remounts the tree so every node re-reads its default.
  const [expandDepth, setExpandDepth] = useState(defaultExpandDepth);
  const [version, setVersion] = useState(0);
  const apply = (d) => {
    setExpandDepth(d);
    setVersion((v) => v + 1);
  };
  const ind = indent === 'tab' ? 4 : Number(indent) || 2;

  return (
    <div className="jview">
      {toolbar && (
        <div className="jview__toolbar">
          <Button size="sm" variant="ghost" onClick={() => apply(Infinity)}>Expand all</Button>
          <Button size="sm" variant="ghost" onClick={() => apply(1)}>Collapse all</Button>
          <span className="faint" style={{ fontSize: 12 }}>Level:</span>
          {[1, 2, 3, 4].map((d) => (
            <Button key={d} size="sm" variant="ghost" active={expandDepth === d} onClick={() => apply(d)}>{d}</Button>
          ))}
        </div>
      )}
      <div className="jview__body">
        <Node key={version} value={value} isLast depth={0} indent={ind} sortKeys={sortKeys} expandDepth={expandDepth} />
      </div>
    </div>
  );
}
