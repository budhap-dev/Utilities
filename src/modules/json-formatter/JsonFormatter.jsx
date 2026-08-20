import { useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import useDebounce from '../../hooks/useDebounce';
import { Panel, CodeArea, CodeOutput, CopyButton, ClearButton, SampleButton, FileButton, Button, Select, Checkbox, Badge, Alert, Toolbar, Stats, Segmented } from '../../components/ui';
import { parseJson, formatJson, minifyJson, escapeJsonString, unescapeJsonString, SAMPLE_JSON } from '../../lib/json';
import JsonView from '../../components/JsonView';

const MODES = [
  { value: 'format', label: 'Format', done: 'Formatted' },
  { value: 'minify', label: 'Minify', done: 'Minified' },
  { value: 'escape', label: 'Escape', done: 'Escaped' },
  { value: 'unescape', label: 'Unescape', done: 'Unescaped' },
];

export default function JsonFormatter() {
  const [input, setInput] = useLocalStorage('json-formatter.input', '');
  const [indent, setIndent] = useLocalStorage('json-formatter.indent', '2');
  const [sortKeys, setSortKeys] = useLocalStorage('json-formatter.sort', false);
  const [mode, setMode] = useState('format');
  const [view, setView] = useLocalStorage('json-formatter.view', 'pretty');
  const debounced = useDebounce(input, 120);

  const { output, error, empty, parsed } = useMemo(() => {
    if (!debounced.trim()) return { empty: true, output: '' };
    if (mode === 'escape') return { output: escapeJsonString(debounced) };
    if (mode === 'unescape') {
      const u = unescapeJsonString(debounced);
      return u === null ? { error: 'Input is not a valid escaped JSON string', output: '' } : { output: u };
    }
    const r = parseJson(debounced);
    if (!r.ok) return { error: r.error.message + (r.error.line ? ` (line ${r.error.line}, col ${r.error.column})` : ''), output: '' };
    return { output: mode === 'minify' ? minifyJson(r.value) : formatJson(r.value, indent, sortKeys), parsed: r.value };
  }, [debounced, mode, indent, sortKeys]);

  const showPretty = mode === 'format' && view === 'pretty' && parsed !== undefined;

  const download = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = mode === 'minify' ? 'data.min.json' : 'data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="tool">
      <Toolbar>
        {MODES.map((m) => (
          <Button key={m.value} size="sm" active={mode === m.value} onClick={() => setMode(m.value)}>
            {m.label}
          </Button>
        ))}
        <span className="toolbar__sep" />
        <Select options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tabs' }]} value={indent} onChange={setIndent} disabled={mode !== 'format'} />
        <Checkbox checked={sortKeys} onChange={setSortKeys}>Sort keys</Checkbox>
        <span className="toolbar__spacer" />
        <Button size="sm" onClick={() => output && setInput(output)} disabled={!output}>Use output as input</Button>
      </Toolbar>
      <div className="tool__grid">
        <Panel
          title="Input"
          actions={
            <>
              <SampleButton onClick={() => setInput(SAMPLE_JSON)} />
              <FileButton accept=".json,application/json,.txt" onFile={(f) => f.text().then(setInput)} />
              <ClearButton onClick={() => setInput('')} disabled={!input} />
            </>
          }
          footer={<Stats items={[['Characters', input.length]]} />}
        >
          <CodeArea value={input} onChange={setInput} placeholder="Paste JSON (or a JSON string to escape / unescape)…" error={!!error} />
        </Panel>
        <Panel
          title={empty ? <Badge>Output</Badge> : error ? <Badge tone="danger">Error</Badge> : <Badge tone="success">{MODES.find((m) => m.value === mode).done}</Badge>}
          actions={
            <>
              {mode === 'format' && (
                <Segmented options={[{ value: 'pretty', label: 'Pretty' }, { value: 'raw', label: 'Raw' }]} value={view} onChange={setView} />
              )}
              <Button size="sm" onClick={download} disabled={!output}>Download</Button>
              <CopyButton text={output} />
            </>
          }
          footer={output && <Stats items={[['Characters', output.length], ['Saved', `${input.length ? Math.round((1 - output.length / input.length) * 100) : 0}%`]]} />}
        >
          {error ? (
            <div style={{ padding: 12 }}><Alert tone="danger">{error}</Alert></div>
          ) : showPretty ? (
            <JsonView value={parsed} indent={indent} sortKeys={sortKeys} />
          ) : (
            <CodeOutput value={output} wrap={mode === 'escape' || mode === 'minify'} placeholder="Formatted output will appear here" />
          )}
        </Panel>
      </div>
    </div>
  );
}
