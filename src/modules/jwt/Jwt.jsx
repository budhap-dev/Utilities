import { useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, CodeArea, CodeOutput, CopyButton, ClearButton, SampleButton, Badge, Alert } from '../../components/ui';
import { decodeJwt, TIME_CLAIMS, SAMPLE_JWT } from '../../lib/jwt';

function fmt(ts) {
  const d = new Date(ts * 1000);
  return isNaN(d) ? String(ts) : `${d.toISOString()} (${d.toLocaleString()})`;
}

export default function Jwt() {
  const [input, setInput] = useLocalStorage('jwt.input', '');
  const r = useMemo(() => decodeJwt(input), [input]);
  const now = Date.now() / 1000;
  const exp = r.ok ? r.payload.exp : undefined;
  const nbf = r.ok ? r.payload.nbf : undefined;
  const expired = typeof exp === 'number' && exp < now;
  const notYet = typeof nbf === 'number' && nbf > now;

  const header = r.ok ? JSON.stringify(r.header, null, 2) : '';
  const payload = r.ok ? JSON.stringify(r.payload, null, 2) : '';

  return (
    <div className="tool">
      <Panel
        title="Token"
        actions={
          <>
            <SampleButton onClick={() => setInput(SAMPLE_JWT)} />
            <ClearButton onClick={() => setInput('')} disabled={!input} />
          </>
        }
        style={{ flex: '0 0 auto' }}
      >
        <CodeArea value={input} onChange={setInput} wrap style={{ minHeight: 110 }} placeholder="Paste a JWT (with or without the 'Bearer ' prefix)…" error={!!r.error} />
      </Panel>
      {r.error && <Alert tone="danger">{r.error}</Alert>}
      {r.ok && (
        <div className="row">
          <Badge tone="accent">alg: {r.header.alg || '?'}</Badge>
          {r.header.typ && <Badge>typ: {r.header.typ}</Badge>}
          {typeof exp === 'number' && (expired ? <Badge tone="danger">Expired</Badge> : <Badge tone="success">Valid until {new Date(exp * 1000).toLocaleString()}</Badge>)}
          {notYet && <Badge tone="warning">Not yet valid</Badge>}
          {!r.signature && <Badge tone="warning">No signature</Badge>}
          <span className="faint" style={{ fontSize: 12 }}>Signature is not verified — decoding only, nothing leaves your browser.</span>
        </div>
      )}
      <div className="tool__grid">
        <Panel title={<span><span className="jtree__key">Header</span></span>} actions={<CopyButton text={header} />}>
          <CodeOutput value={header} placeholder="Decoded header" />
        </Panel>
        <Panel title={<span><span className="jtree__string">Payload</span></span>} actions={<CopyButton text={payload} />}>
          <CodeOutput value={payload} placeholder="Decoded payload" />
        </Panel>
      </div>
      {r.ok && (
        <Panel title="Claims" padded>
          <table className="table">
            <thead><tr><th>Claim</th><th>Value</th><th>Interpretation</th></tr></thead>
            <tbody>
              {Object.entries(r.payload).map(([k, v]) => (
                <tr key={k}>
                  <td className="mono">{k}</td>
                  <td className="mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                  <td className="muted">{TIME_CLAIMS[k] && typeof v === 'number' ? `${TIME_CLAIMS[k]}: ${fmt(v)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.signature && (
            <div style={{ marginTop: 12 }}>
              <span className="kv__label">Signature (base64url)</span>
              <div className="kv__value" style={{ marginTop: 4 }}>{r.signature}</div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
