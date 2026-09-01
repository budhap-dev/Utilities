import { useMemo } from 'react';
import cronstrue from 'cronstrue';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, Alert, Badge, Toolbar, Button, Select } from '../../components/ui';
import { parseCron, nextRuns, describeField, CRON_PRESETS, FORMATS } from '../../lib/cron';
import { localTimeZone } from '../../lib/datetime';

const FORMAT_LABEL = { standard: 'Standard · 5 fields', seconds: 'With seconds · 6 fields', quartz: 'Quartz · 7 fields' };

function relative(d, hasSeconds) {
  const s = Math.round((d - Date.now()) / 1000);
  if (hasSeconds && s < 90) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.round(m / 60)} h`;
  return `${Math.round(m / 1440)} d`;
}

export default function Cron() {
  const [expr, setExpr] = useLocalStorage('cron.expr', '*/15 9-17 * * 1-5');
  const [count, setCount] = useLocalStorage('cron.count', '10');
  const [format, setFormat] = useLocalStorage('cron.format', 'auto');

  const result = useMemo(() => {
    try {
      const parsed = parseCron(expr, format);
      let human = '';
      try {
        const normalized = expr.trim().startsWith('@') ? parsed.fields.map((f) => f.raw).join(' ') : expr;
        human = cronstrue.toString(normalized, { verbose: true });
      } catch {
        human = '';
      }
      return { parsed, human, runs: nextRuns(expr, Number(count) || 10, new Date(), format) };
    } catch (e) {
      return { error: e.message };
    }
  }, [expr, count, format]);

  const hasSeconds = result.parsed?.hasSeconds;
  const timeOpts = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', ...(hasSeconds ? { second: '2-digit' } : {}) };

  return (
    <div className="tool">
      <Toolbar>
        <input
          className="input mono"
          style={{ flex: 1, minWidth: 240, fontSize: 15 }}
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="[second] minute hour day-of-month month day-of-week [year]"
          spellCheck={false}
        />
        <Select options={FORMATS.map((f) => ({ value: f.id, label: f.label }))} value={format} onChange={setFormat} />
        <Select
          options={[{ value: '', label: 'Presets…' }, ...CRON_PRESETS.map((p) => ({ value: p.value, label: p.label }))]}
          value={CRON_PRESETS.some((p) => p.value === expr) ? expr : ''}
          onChange={(v) => v && setExpr(v)}
        />
        <Select options={['5', '10', '20', '50'].map((n) => ({ value: n, label: `Next ${n}` }))} value={count} onChange={setCount} />
        <Button variant="ghost" onClick={() => setExpr('')}>Clear</Button>
      </Toolbar>
      {result.error ? (
        <Alert tone="danger">{result.error}</Alert>
      ) : (
        <Alert tone="success">
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15 }}>{result.human || 'Valid expression'}</span>
          <span style={{ marginLeft: 12 }}>
            <Badge tone="accent">{FORMAT_LABEL[result.parsed.format]}</Badge>
          </span>
        </Alert>
      )}
      <div className="tool__grid" style={{ minHeight: 0 }}>
        <Panel title="Fields" padded>
          {result.parsed ? (
            <table className="table">
              <thead><tr><th>Field</th><th>Value</th><th>Allowed</th><th>Expands to</th></tr></thead>
              <tbody>
                {result.parsed.fields.map((f, i) => (
                  <tr key={i}>
                    <td>{f.name}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{f.raw}</td>
                    <td className="faint">{f.min}–{f.max}{f.name === 'day of week' && (result.parsed.format === 'quartz' ? ' (1 = SUN)' : ' (0/7 = SUN)')}</td>
                    <td className="mono muted" style={{ wordBreak: 'break-word' }}>{f.any ? <Badge>any</Badge> : describeField(f)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">Fix the expression to see its fields.</div>
          )}
          <div className="faint" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6 }}>
            <b>5 fields</b> minute hour day month weekday · <b>6 fields</b> adds a leading <span className="mono">second</span> ·{' '}
            <b>7 fields (Quartz)</b> adds <span className="mono">second</span> first and <span className="mono">year</span> last, with weekdays 1–7 (1 = Sunday).
            <br />
            Supports <span className="mono">* , - / ?</span>, month / weekday names, <span className="mono">L</span> (last day, <span className="mono">FRIL</span> last Friday),{' '}
            <span className="mono">#</span> (<span className="mono">FRI#3</span> third Friday) and <span className="mono">@hourly</span>-style aliases. When both day-of-month and
            day-of-week are restricted, a run happens if <i>either</i> matches.
          </div>
        </Panel>
        <Panel title={`Next runs (${localTimeZone()})`} padded>
          {result.runs?.length ? (
            <table className="table">
              <thead><tr><th>#</th><th>Local</th><th>UTC</th><th>In</th></tr></thead>
              <tbody>
                {result.runs.map((d, i) => (
                  <tr key={i}>
                    <td className="faint">{i + 1}</td>
                    <td className="mono">{d.toLocaleString(undefined, timeOpts)}</td>
                    <td className="mono muted">{d.toISOString().replace('T', ' ').slice(0, hasSeconds ? 19 : 16)}Z</td>
                    <td className="faint">{relative(d, hasSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">{result.parsed ? 'No upcoming runs found (e.g. a past year or Feb 30).' : 'Enter a valid expression.'}</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
