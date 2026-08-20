import { useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, CodeArea, CodeOutput, CopyButton, ClearButton, SampleButton, FileButton, Checkbox, Segmented, Badge, Alert, Toolbar, Button, Stats } from '../../components/ui';
import { encodeBase64, decodeBase64, bytesToBase64 } from '../../lib/base64';

export default function Base64() {
  const [input, setInput] = useLocalStorage('base64.input', '');
  const [mode, setMode] = useLocalStorage('base64.mode', 'encode');
  const [urlSafe, setUrlSafe] = useLocalStorage('base64.urlsafe', false);
  const [fileInfo, setFileInfo] = useState(null);

  const { output, error } = useMemo(() => {
    if (!input) return { output: '' };
    try {
      return { output: mode === 'encode' ? encodeBase64(input, { urlSafe }) : decodeBase64(input) };
    } catch (e) {
      return { output: '', error: e.message };
    }
  }, [input, mode, urlSafe]);

  const onFile = async (f) => {
    const buf = new Uint8Array(await f.arrayBuffer());
    const b64 = bytesToBase64(buf);
    setMode('encode');
    setFileInfo({ name: f.name, size: f.size, type: f.type || 'application/octet-stream', b64 });
  };

  const fileOutput = fileInfo ? `data:${fileInfo.type};base64,${fileInfo.b64}` : '';

  return (
    <div className="tool">
      <Toolbar>
        <Segmented options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} value={mode} onChange={(m) => { setMode(m); setFileInfo(null); }} />
        <Checkbox checked={urlSafe} onChange={setUrlSafe}>URL-safe (RFC 4648 §5, no padding)</Checkbox>
        <span className="toolbar__spacer" />
        <Button size="sm" onClick={() => { setInput(output); setMode(mode === 'encode' ? 'decode' : 'encode'); }} disabled={!output}>Swap ↔</Button>
      </Toolbar>
      <div className="tool__grid">
        <Panel
          title={mode === 'encode' ? 'Plain text' : 'Base64'}
          actions={
            <>
              <SampleButton onClick={() => { setFileInfo(null); setInput(mode === 'encode' ? 'Hello, DevKit! 👋 Ünïcödé works too.' : 'SGVsbG8sIERldktpdCEg8J+RiyDDnG7Dr2PDtmTDqSB3b3JrcyB0b28u'); }} />
              <FileButton onFile={onFile}>File → Base64</FileButton>
              <ClearButton onClick={() => { setInput(''); setFileInfo(null); }} disabled={!input && !fileInfo} />
            </>
          }
          footer={<Stats items={[['Characters', input.length], ['Bytes', new TextEncoder().encode(input).length]]} />}
        >
          {fileInfo ? (
            <div className="empty-state">
              <div>
                <b>{fileInfo.name}</b> · {fileInfo.size.toLocaleString()} bytes · {fileInfo.type}
                <br />
                <span className="faint">Encoded as a data URI on the right.</span>
              </div>
            </div>
          ) : (
            <CodeArea value={input} onChange={setInput} wrap placeholder={mode === 'encode' ? 'Text to encode…' : 'Base64 to decode (data URIs and URL-safe variants accepted)…'} error={!!error} />
          )}
        </Panel>
        <Panel
          title={error ? <Badge tone="danger">Error</Badge> : <Badge tone="success">{mode === 'encode' ? 'Base64' : 'Decoded'}</Badge>}
          actions={<CopyButton text={fileInfo ? fileOutput : output} />}
          footer={<Stats items={[['Characters', (fileInfo ? fileOutput : output).length]]} />}
        >
          {error ? <div style={{ padding: 12 }}><Alert tone="danger">{error}</Alert></div> : <CodeOutput value={fileInfo ? fileOutput : output} wrap />}
        </Panel>
      </div>
    </div>
  );
}
