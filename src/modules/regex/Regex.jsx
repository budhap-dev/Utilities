import { useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import useDebounce from '../../hooks/useDebounce';
import { Panel, CodeArea, Checkbox, Badge, Alert, Toolbar, SampleButton, ClearButton, CopyButton } from '../../components/ui';

const FLAGS = [
  { f: 'g', label: 'global' },
  { f: 'i', label: 'ignore case' },
  { f: 'm', label: 'multiline' },
  { f: 's', label: 'dotAll' },
  { f: 'u', label: 'unicode' },
];

const CHEATSHEET = [
  ['.', 'any char'], ['\\d \\w \\s', 'digit / word / space'], ['[abc] [^abc]', 'set / negated set'], ['a* a+ a? a{2,4}', 'quantifiers'],
  ['^ $', 'line start / end'], ['\\b', 'word boundary'], ['(x) (?:x)', 'capture / non-capture'], ['(?<name>x)', 'named group'],
  ['x(?=y) x(?!y)', 'lookahead'], ['(?<=y)x', 'lookbehind'], ['a|b', 'alternation'], ['*? +?', 'lazy quantifiers'],
];

function runRegex(pattern, flags, text) {
  if (!pattern) return { matches: [] };
  let re;
  try {
    re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  } catch (e) {
    return { error: e.message, matches: [] };
  }
  const matches = [];
  let m;
  let guard = 0;
  while ((m = re.exec(text)) !== null && guard++ < 5000) {
    matches.push({ index: m.index, text: m[0], groups: m.slice(1), named: m.groups || {} });
    if (m[0] === '') re.lastIndex++;
    if (!flags.includes('g') && matches.length) break;
  }
  return { matches };
}

function Highlighted({ text, matches }) {
  if (!matches.length) return <>{text}</>;
  const parts = [];
  let last = 0;
  matches.forEach((m, i) => {
    if (m.index > last) parts.push(<span key={`t${i}`}>{text.slice(last, m.index)}</span>);
    parts.push(<mark key={`m${i}`}>{m.text || '​'}</mark>);
    last = m.index + m.text.length;
  });
  if (last < text.length) parts.push(<span key="end">{text.slice(last)}</span>);
  return <>{parts}</>;
}

export default function Regex() {
  const [pattern, setPattern] = useLocalStorage('regex.pattern', '');
  const [flags, setFlags] = useLocalStorage('regex.flags', 'g');
  const [text, setText] = useLocalStorage('regex.text', '');
  const dPattern = useDebounce(pattern, 120);
  const dText = useDebounce(text, 120);
  const result = useMemo(() => runRegex(dPattern, flags, dText), [dPattern, flags, dText]);
  const toggle = (f) => setFlags(flags.includes(f) ? flags.replace(f, '') : flags + f);
  const groupCount = result.matches.reduce((n, m) => Math.max(n, m.groups.length), 0);

  return (
    <div className="tool">
      <Toolbar>
        <span className="mono faint">/</span>
        <input className="input mono" style={{ flex: 1, minWidth: 240 }} placeholder="pattern, e.g. (\w+)@(\w+)\.com" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} />
        <span className="mono faint">/{flags}</span>
        {FLAGS.map((x) => (
          <Checkbox key={x.f} checked={flags.includes(x.f)} onChange={() => toggle(x.f)}>
            <span className="mono">{x.f}</span> {x.label}
          </Checkbox>
        ))}
        <SampleButton onClick={() => { setPattern('(?<user>[\\w.]+)@(?<domain>[\\w.]+)'); setFlags('g'); setText('Contact priya@example.com or marco.rossi@devkit.io for access.\nInvalid: not-an-email@\nAlso ana@team.dev works.'); }} />
      </Toolbar>
      {result.error && <Alert tone="danger">{result.error}</Alert>}
      <div className="tool__grid">
        <Panel title="Test string" actions={<ClearButton onClick={() => setText('')} disabled={!text} />}>
          <CodeArea value={text} onChange={setText} wrap placeholder="Text to test against…" />
        </Panel>
        <Panel title={<span>Preview {dPattern && !result.error && <Badge tone={result.matches.length ? 'success' : 'warning'}>{result.matches.length} match{result.matches.length === 1 ? '' : 'es'}</Badge>}</span>}>
          <div className="regex-preview">{dText ? <Highlighted text={dText} matches={result.matches} /> : <span className="faint">Preview with highlighted matches</span>}</div>
        </Panel>
      </div>
      <div className="tool__grid" style={{ minHeight: 0, flex: '0 0 auto' }}>
        <Panel title="Matches" padded actions={<CopyButton text={result.matches.map((m) => m.text).join('\n')} label="Copy matches" />}>
          {result.matches.length ? (
            <div style={{ overflow: 'auto', maxHeight: 320 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th><th>Index</th><th>Match</th>
                    {Array.from({ length: groupCount }, (_, i) => <th key={i}>Group {i + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.matches.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="mono">{m.index}</td>
                      <td className="mono">{m.text}</td>
                      {Array.from({ length: groupCount }, (_, g) => (
                        <td key={g} className="mono">
                          {m.groups[g] ?? <span className="faint">—</span>}
                          {Object.entries(m.named).find(([, v]) => v === m.groups[g] && v !== undefined) && (
                            <span className="faint"> ({Object.entries(m.named).find(([, v]) => v === m.groups[g])[0]})</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No matches yet.</div>
          )}
        </Panel>
        <Panel title="Cheatsheet" padded>
          <table className="table">
            <tbody>
              {CHEATSHEET.map(([k, v]) => (
                <tr key={k}><td className="mono" style={{ width: '40%' }}>{k}</td><td className="muted">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
