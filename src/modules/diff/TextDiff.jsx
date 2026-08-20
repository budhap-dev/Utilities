import { useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import useDebounce from '../../hooks/useDebounce';
import { Panel, CodeArea, ClearButton, SampleButton, FileButton, Checkbox, Segmented, Badge, Toolbar, Button } from '../../components/ui';
import { ArrowLeftRight } from '../../components/Icons';
import { computeDiff, SAMPLE_A, SAMPLE_B } from '../../lib/diff';

function Segments({ segments, text }) {
  if (!segments) return text;
  return segments.map((s, i) => (s.type ? <mark key={i} className={s.type}>{s.text}</mark> : <span key={i}>{s.text}</span>));
}

function SideBySide({ rows }) {
  return (
    <table>
      <tbody>
        {rows.map((r, i) => {
          const lcls = r.type === 'del' || r.type === 'mod' ? 'del' : r.type === 'eq' ? '' : 'empty';
          const rcls = r.type === 'add' || r.type === 'mod' ? 'add' : r.type === 'eq' ? '' : 'empty';
          return (
            <tr key={i}>
              <td className={`ln ${lcls === 'del' ? 'del' : ''}`}>{r.left?.n ?? ''}</td>
              <td className={`code side-l ${lcls}`} style={lcls === 'del' ? { background: 'var(--diff-del)' } : undefined}>
                {r.left ? <Segments segments={r.left.segments} text={r.left.text} /> : ''}
              </td>
              <td className="ln">{r.right?.n ?? ''}</td>
              <td className={`code ${rcls}`} style={rcls === 'add' ? { background: 'var(--diff-add)' } : undefined}>
                {r.right ? <Segments segments={r.right.segments} text={r.right.text} /> : ''}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Unified({ rows }) {
  const lines = [];
  rows.forEach((r, i) => {
    if (r.type === 'eq') lines.push({ key: `${i}e`, cls: '', sign: ' ', l: r.left.n, r: r.right.n, text: r.left.text });
    if (r.type === 'del' || r.type === 'mod') lines.push({ key: `${i}d`, cls: 'del', sign: '-', l: r.left.n, r: '', text: r.left.text, seg: r.left.segments });
    if (r.type === 'add' || r.type === 'mod') lines.push({ key: `${i}a`, cls: 'add', sign: '+', l: '', r: r.right.n, text: r.right.text, seg: r.right.segments });
  });
  return (
    <table>
      <tbody>
        {lines.map((x) => (
          <tr key={x.key} className={x.cls}>
            <td className="ln">{x.l}</td>
            <td className="ln">{x.r}</td>
            <td className="sign">{x.sign}</td>
            <td className="code">
              <Segments segments={x.seg} text={x.text} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TextDiff() {
  const [a, setA] = useLocalStorage('diff.a', '');
  const [b, setB] = useLocalStorage('diff.b', '');
  const [view, setView] = useLocalStorage('diff.view', 'split');
  const [ignoreWs, setIgnoreWs] = useLocalStorage('diff.ignoreWs', false);
  const [ignoreCase, setIgnoreCase] = useLocalStorage('diff.ignoreCase', false);
  const [onlyChanges, setOnlyChanges] = useLocalStorage('diff.onlyChanges', false);
  const da = useDebounce(a, 150);
  const db = useDebounce(b, 150);

  const result = useMemo(() => computeDiff(da, db, { ignoreWhitespace: ignoreWs, ignoreCase }), [da, db, ignoreWs, ignoreCase]);

  const rows = useMemo(() => {
    if (!onlyChanges) return result.rows;
    // keep 2 lines of context around changes
    const keep = new Set();
    result.rows.forEach((r, i) => {
      if (r.type !== 'eq') for (let k = i - 2; k <= i + 2; k++) keep.add(k);
    });
    return result.rows.filter((_, i) => keep.has(i));
  }, [result, onlyChanges]);

  const hasInput = da.length > 0 || db.length > 0;

  return (
    <div className="tool">
      <div className="tool__grid" style={{ minHeight: 220, flex: '0 0 auto', height: 240 }}>
        <Panel
          title="Original"
          actions={
            <>
              <FileButton onFile={(f) => f.text().then(setA)} />
              <ClearButton onClick={() => setA('')} disabled={!a} />
            </>
          }
        >
          <CodeArea value={a} onChange={setA} placeholder="Paste or drop the original text / file…" />
        </Panel>
        <Panel
          title="Modified"
          actions={
            <>
              <FileButton onFile={(f) => f.text().then(setB)} />
              <ClearButton onClick={() => setB('')} disabled={!b} />
            </>
          }
        >
          <CodeArea value={b} onChange={setB} placeholder="Paste or drop the modified text / file…" />
        </Panel>
      </div>

      <Toolbar>
        <Segmented options={[{ value: 'split', label: 'Side by side' }, { value: 'unified', label: 'Unified' }]} value={view} onChange={setView} />
        <Checkbox checked={ignoreWs} onChange={setIgnoreWs}>Ignore whitespace</Checkbox>
        <Checkbox checked={ignoreCase} onChange={setIgnoreCase}>Ignore case</Checkbox>
        <Checkbox checked={onlyChanges} onChange={setOnlyChanges}>Only changes</Checkbox>
        <span className="toolbar__spacer" />
        <Button size="sm" variant="ghost" icon={<ArrowLeftRight width={14} height={14} />} onClick={() => { setA(b); setB(a); }}>Swap</Button>
        <SampleButton onClick={() => { setA(SAMPLE_A); setB(SAMPLE_B); }} />
        {hasInput && (
          result.identical ? <Badge tone="success">Identical</Badge> : (
            <>
              <Badge tone="success">+{result.added}</Badge>
              <Badge tone="danger">−{result.removed}</Badge>
            </>
          )
        )}
      </Toolbar>

      <Panel title="Diff" className="grow" style={{ minHeight: 300 }}>
        {!hasInput ? (
          <div className="empty-state">Enter two texts (or drop two files) to compare them.</div>
        ) : (
          <div className="diff">{view === 'split' ? <SideBySide rows={rows} /> : <Unified rows={rows} />}</div>
        )}
      </Panel>
    </div>
  );
}
