import { useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, CodeArea, CodeOutput, CopyButton, ClearButton, SampleButton, Segmented, Badge, Alert, Toolbar, KV } from '../../components/ui';

function analyse(text) {
  try {
    const u = new URL(text.trim());
    const params = [...u.searchParams.entries()];
    return { url: u, params };
  } catch {
    return null;
  }
}

export default function Url() {
  const [input, setInput] = useLocalStorage('url.input', '');
  const [mode, setMode] = useLocalStorage('url.mode', 'encode');
  const [scope, setScope] = useLocalStorage('url.scope', 'component');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '' };
    try {
      if (mode === 'encode') return { output: scope === 'component' ? encodeURIComponent(input) : encodeURI(input) };
      return { output: scope === 'component' ? decodeURIComponent(input.replace(/\+/g, '%20')) : decodeURI(input) };
    } catch (e) {
      return { output: '', error: e.message };
    }
  }, [input, mode, scope]);

  const info = useMemo(() => analyse(mode === 'decode' && output ? output : input), [input, output, mode]);

  return (
    <div className="tool">
      <Toolbar>
        <Segmented options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} value={mode} onChange={setMode} />
        <Segmented options={[{ value: 'component', label: 'Component (encodeURIComponent)' }, { value: 'full', label: 'Full URI (encodeURI)' }]} value={scope} onChange={setScope} />
      </Toolbar>
      <div className="tool__grid">
        <Panel
          title="Input"
          actions={
            <>
              <SampleButton onClick={() => setInput(mode === 'encode' ? 'https://example.com/search?q=dev kit & tools&lang=en#top' : 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddev%20kit%20%26%20tools%26lang%3Den')} />
              <ClearButton onClick={() => setInput('')} disabled={!input} />
            </>
          }
        >
          <CodeArea value={input} onChange={setInput} wrap placeholder="Text or URL…" error={!!error} />
        </Panel>
        <Panel title={error ? <Badge tone="danger">Error</Badge> : <Badge tone="success">{mode === 'encode' ? 'Encoded' : 'Decoded'}</Badge>} actions={<CopyButton text={output} />}>
          {error ? <div style={{ padding: 12 }}><Alert tone="danger">{error}</Alert></div> : <CodeOutput value={output} wrap />}
        </Panel>
      </div>
      {info && (
        <Panel title="URL breakdown" padded>
          <div className="kv" style={{ marginBottom: 16 }}>
            <KV label="Protocol" value={info.url.protocol} />
            <KV label="Host" value={info.url.host} />
            <KV label="Path" value={info.url.pathname} />
            <KV label="Hash" value={info.url.hash} />
          </div>
          {info.params.length > 0 && (
            <table className="table">
              <thead>
                <tr><th>Query parameter</th><th>Value (decoded)</th></tr>
              </thead>
              <tbody>
                {info.params.map(([k, v], i) => (
                  <tr key={i}><td className="mono">{k}</td><td className="mono">{v}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}
    </div>
  );
}
