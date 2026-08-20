import { useMemo } from 'react';
import cronstrue from 'cronstrue';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, Alert, Badge, Toolbar, Button, Select } from '../../components/ui';
import { parseCron, nextRuns, CRON_PRESETS } from '../../lib/cron';
import { localTimeZone } from '../../lib/datetime';

export default function Cron() {
  const [expr, setExpr] = useLocalStorage('cron.expr', '*/15 9-17 * * 1-5');
  const [count, setCount] = useLocalStorage('cron.count', '10');

  const result = useMemo(() => {
    try {
      const fields = parseCron(expr);
      let human = '';
      try {
        human = cronstrue.toString(expr.trim().startsWith('@') ? fields.map((f) => f.raw).join(' ') : expr, { verbose: true });
      } catch {
        human = '';
      }
      return { fields, human, runs: nextRuns(expr, Number(count) || 10) };
    } catch (e) {
      return { error: e.message };
    }
  }, [expr, count]);

  return (
    <div className="tool">
      <Toolbar>
        <input className="input mono" style={{ flex: 1, minWidth: 240, fontSize: 15 }} value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="minute hour day-of-month month day-of-week" spellCheck={false} />
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
        </Alert>
      )}
      <div className="tool__grid" style={{ minHeight: 0 }}>
        <Panel title="Fields" padded>
          {result.fields ? (
            <table className="table">
              <thead><tr><th>Field</th><th>Value</th><th>Allowed</th><th>Expands to</th></tr></thead>
              <tbody>
                {result.fields.map((f) => (
                  <tr key={f.name}>
                    <td>{f.name}</td>
                    <td className="mono">{f.raw}</td>
                    <td className="faint">{f.min}–{f.max}</td>
                    <td className="mono muted" style={{ wordBreak: 'break-word' }}>
                      {f.any ? <Badge>any</Badge> : [...f.set].filter((v) => !(f.name === 'day of week' && v === 7)).sort((a, b) => a - b).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">Fix the expression to see its fields.</div>
          )}
          <div className="faint" style={{ marginTop: 12, fontSize: 12 }}>
            Supports <span className="mono">* , - /</span>, month / weekday names, and <span className="mono">@hourly</span>-style aliases. When both day-of-month and day-of-week are restricted, a run happens if <i>either</i> matches (standard cron).
          </div>
        </Panel>
        <Panel title={`Next runs (${localTimeZone()})`} padded>
          {result.runs?.length ? (
            <table className="table">
              <thead><tr><th>#</th><th>Local</th><th>UTC</th><th>In</th></tr></thead>
              <tbody>
                {result.runs.map((d, i) => {
                  const mins = Math.round((d - Date.now()) / 60000);
                  const rel = mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`;
                  return (
                    <tr key={i}>
                      <td className="faint">{i + 1}</td>
                      <td className="mono">{d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="mono muted">{d.toISOString().replace('T', ' ').slice(0, 16)}Z</td>
                      <td className="faint">{rel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">{result.fields ? 'No upcoming runs found (e.g. Feb 30).' : 'Enter a valid expression.'}</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
