import { useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import useDebounce from '../../hooks/useDebounce';
import { Panel, CodeArea, CopyButton, ClearButton, SampleButton, FileButton, Badge, Alert, Segmented, Stats, Button } from '../../components/ui';
import { parseJson, SAMPLE_JSON, jsonStats, formatJson } from '../../lib/json';
import JsonTree from './JsonTree';
import JsonView from '../../components/JsonView';

export default function JsonParser() {
  const [input, setInput] = useLocalStorage('json-parser.input', '');
  const [view, setView] = useState('tree');
  const debounced = useDebounce(input, 120);
  const result = useMemo(() => parseJson(debounced), [debounced]);
  const stats = useMemo(() => (result.ok ? jsonStats(result.value) : null), [result]);
  const formatted = useMemo(() => (result.ok ? formatJson(result.value, 2) : ''), [result]);
  // When the whole document is a JSON string (e.g. double-encoded JSON from a
  // log), copy its contents without the wrapping quotes / escaping.
  const isStringDoc = result.ok && typeof result.value === 'string';
  const copyText = isStringDoc ? result.value : formatted;
  const innerJson = useMemo(() => (isStringDoc ? parseJson(result.value) : null), [isStringDoc, result]);
  const canUnwrap = !!(innerJson && innerJson.ok && innerJson.value !== null && typeof innerJson.value === 'object');

  const status = result.empty ? (
    <Badge>Waiting for input</Badge>
  ) : result.ok ? (
    <Badge tone="success">Valid JSON</Badge>
  ) : (
    <Badge tone="danger">Invalid{result.error.line ? ` · line ${result.error.line}, col ${result.error.column}` : ''}</Badge>
  );

  const jumpToError = () => {
    if (!result.error?.position && result.error?.position !== 0) return;
    const ta = document.getElementById('json-parser-input');
    if (ta) {
      ta.focus();
      ta.setSelectionRange(result.error.position, result.error.position + 1);
    }
  };

  return (
    <div className="tool">
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
          footer={<Stats items={[['Characters', input.length], ['Lines', input ? input.split('\n').length : 0]]} />}
        >
          <CodeArea id="json-parser-input" value={input} onChange={setInput} placeholder="Paste JSON here…" error={!!result.error} />
        </Panel>
        <Panel
          title={status}
          actions={
            <>
              {canUnwrap && (
                <Button size="sm" variant="primary" onClick={() => setInput(result.value)} title="The document is a JSON string that itself contains JSON — replace the input with its contents">
                  Unwrap inner JSON
                </Button>
              )}
              <Segmented options={[{ value: 'tree', label: 'Tree' }, { value: 'text', label: 'Formatted' }]} value={view} onChange={setView} />
              <CopyButton text={copyText} title={isStringDoc ? 'Copies the string contents without the surrounding quotes' : 'Copy formatted JSON'} />
            </>
          }
          footer={stats && <Stats items={[['Keys', stats.keys], ['Nodes', stats.nodes], ['Depth', stats.depth], ['Type', Array.isArray(result.value) ? 'array' : typeof result.value]]} />}
        >
          {result.error && (
            <div style={{ padding: 12 }}>
              <Alert tone="danger">
                {result.error.message}
                {result.error.line && (
                  <>
                    {' '}at line {result.error.line}, column {result.error.column}.{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); jumpToError(); }}>Jump to error</a>
                  </>
                )}
              </Alert>
            </div>
          )}
          {result.ok && view === 'tree' && <JsonTree value={result.value} />}
          {result.ok && view === 'text' && <JsonView value={result.value} />}
          {result.empty && <div className="empty-state">Paste or drop a JSON file to validate and explore it.</div>}
        </Panel>
      </div>
    </div>
  );
}
