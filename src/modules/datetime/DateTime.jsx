import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, KV, Button, Select, Alert, Badge, Toolbar } from '../../components/ui';
import { parseDateInput, describeDate, listTimeZones, localTimeZone, formatInZone, COMMON_ZONES } from '../../lib/datetime';

const UNITS = [
  { value: 'auto', label: 'Auto-detect unit' },
  { value: 's', label: 'Seconds' },
  { value: 'ms', label: 'Milliseconds' },
  { value: 'us', label: 'Microseconds' },
  { value: 'ns', label: 'Nanoseconds' },
];

export default function DateTime() {
  const [input, setInput] = useLocalStorage('datetime.input', '');
  const [unit, setUnit] = useLocalStorage('datetime.unit', 'auto');
  const [tz, setTz] = useLocalStorage('datetime.tz', localTimeZone());
  const [now, setNow] = useState(() => new Date());
  const zones = useMemo(() => listTimeZones(), []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const parsed = useMemo(() => parseDateInput(input, unit), [input, unit]);
  const desc = useMemo(() => (parsed.ok ? describeDate(parsed.date, tz) : null), [parsed, tz]);
  const nowDesc = useMemo(() => describeDate(now, tz), [now, tz]);

  return (
    <div className="tool">
      <Toolbar>
        <input
          className="input mono"
          style={{ flex: 1, minWidth: 260 }}
          placeholder="Epoch (1692525600), ISO (2026-08-20T09:30:00Z), 'now', or any date string…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Select options={UNITS} value={unit} onChange={setUnit} />
        <Select options={zones.map((z) => ({ value: z, label: z }))} value={tz} onChange={setTz} style={{ maxWidth: 220 }} />
        <Button onClick={() => setInput(String(Date.now()))}>Now (ms)</Button>
        <Button onClick={() => setInput(new Date().toISOString())}>Now (ISO)</Button>
        <Button variant="ghost" onClick={() => setInput('')}>Clear</Button>
      </Toolbar>

      <div className="tool__grid" style={{ minHeight: 0 }}>
        <Panel
          title={
            parsed.empty ? <Badge>Converted</Badge> : parsed.ok ? <Badge tone="success">Parsed as {parsed.kind}</Badge> : <Badge tone="danger">Invalid</Badge>
          }
          padded
        >
          {parsed.error && <Alert tone="danger">{parsed.error}</Alert>}
          {parsed.empty && <div className="empty-state">Enter a timestamp above. Epoch unit is auto-detected from magnitude.</div>}
          {desc && (
            <div className="kv">
              <KV label="Epoch (seconds)" value={desc.epochSeconds} />
              <KV label="Epoch (milliseconds)" value={desc.epochMillis} />
              <KV label="ISO 8601 (UTC)" value={desc.isoUtc} />
              <KV label={`ISO 8601 (${tz})`} value={desc.isoTz} />
              <KV label="RFC 2822" value={desc.rfc2822} />
              <KV label="Human readable" value={desc.human} />
              <KV label="Date" value={desc.dateOnly} />
              <KV label="Time" value={desc.timeOnly} />
              <KV label="Relative" value={desc.relative} />
              <KV label="ISO week / day of year" value={`W${desc.isoWeek} · day ${desc.dayOfYear}`} />
            </div>
          )}
        </Panel>

        <div className="stack" style={{ minHeight: 0 }}>
          <Panel title="Around the world" padded>
            {parsed.ok ? (
              <table className="table">
                <tbody>
                  {[...new Set([tz, ...COMMON_ZONES])].map((z) => (
                    <tr key={z}>
                      <td className="muted">{z}</td>
                      <td className="mono">{formatInZone(parsed.date, z)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">Convert a timestamp to see it across common timezones.</div>
            )}
          </Panel>
          <Panel title="Right now" padded footer={<span>Ticks every second · local zone {localTimeZone()}</span>}>
            <div className="kv">
              <KV label="Epoch (seconds)" value={nowDesc.epochSeconds} />
              <KV label="Epoch (milliseconds)" value={nowDesc.epochMillis} />
              <KV label="ISO 8601 (UTC)" value={nowDesc.isoUtc} />
              <KV label={`Local (${tz})`} value={nowDesc.human} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
