import { useEffect, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import useDebounce from '../../hooks/useDebounce';
import { Panel, CodeArea, CopyButton, ClearButton, SampleButton, FileButton, Segmented, KV, Toolbar, Stats } from '../../components/ui';
import { bytesToBase64 } from '../../lib/base64';

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

async function digestAll(data) {
  const out = {};
  for (const algo of ALGOS) {
    const buf = await crypto.subtle.digest(algo, data);
    const bytes = new Uint8Array(buf);
    out[algo] = { hex: [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(''), b64: bytesToBase64(bytes) };
  }
  return out;
}

export default function Hash() {
  const [input, setInput] = useLocalStorage('hash.input', '');
  const [format, setFormat] = useLocalStorage('hash.format', 'hex');
  const [file, setFile] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [busy, setBusy] = useState(false);
  const debounced = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (file) {
        setBusy(true);
        const data = await file.arrayBuffer();
        const h = await digestAll(data);
        if (!cancelled) {
          setHashes(h);
          setBusy(false);
        }
        return;
      }
      if (!debounced) {
        setHashes(null);
        return;
      }
      const h = await digestAll(new TextEncoder().encode(debounced));
      if (!cancelled) setHashes(h);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, file]);

  return (
    <div className="tool">
      <Toolbar>
        <Segmented options={[{ value: 'hex', label: 'Hex' }, { value: 'b64', label: 'Base64' }]} value={format} onChange={setFormat} />
        <span className="faint" style={{ fontSize: 12 }}>Computed with Web Crypto (SubtleCrypto) — MD5 is not offered because it is cryptographically broken.</span>
      </Toolbar>
      <div className="tool__grid">
        <Panel
          title={file ? 'File' : 'Text'}
          actions={
            <>
              <SampleButton onClick={() => { setFile(null); setInput('The quick brown fox jumps over the lazy dog'); }} />
              <FileButton onFile={(f) => { setFile(f); }}>Hash a file</FileButton>
              <ClearButton onClick={() => { setInput(''); setFile(null); }} disabled={!input && !file} />
            </>
          }
          footer={<Stats items={[['Bytes', file ? file.size : new TextEncoder().encode(input).length]]} />}
        >
          {file ? (
            <div className="empty-state">
              <div>
                <b>{file.name}</b> · {file.size.toLocaleString()} bytes
                <br />
                <span className="faint">{busy ? 'Hashing…' : 'Hashed. Choose another file or clear to hash text.'}</span>
              </div>
            </div>
          ) : (
            <CodeArea value={input} onChange={setInput} wrap placeholder="Text to hash…" />
          )}
        </Panel>
        <Panel title="Digests" padded>
          {hashes ? (
            <div className="kv">
              {ALGOS.map((a) => (
                <KV key={a} label={a} value={hashes[a][format]} />
              ))}
            </div>
          ) : (
            <div className="empty-state">Type some text or pick a file to see its hashes.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
