import { useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Panel, CodeArea, CodeOutput, CopyButton, ClearButton, SampleButton, Button, Segmented, KV, Toolbar, Stats } from '../../components/ui';
import { CASES, LINE_OPS, textStats, loremIpsum } from '../../lib/text';

export default function TextUtils() {
  const [input, setInput] = useLocalStorage('text.input', '');
  const [tab, setTab] = useLocalStorage('text.tab', 'case');
  const [lineOut, setLineOut] = useState('');
  const [paras, setParas] = useState(3);
  const stats = useMemo(() => textStats(input), [input]);
  const lines = useMemo(() => (input ? input.split('\n') : []), [input]);

  return (
    <div className="tool">
      <Toolbar>
        <Segmented
          options={[{ value: 'case', label: 'Case' }, { value: 'lines', label: 'Lines' }, { value: 'stats', label: 'Stats' }, { value: 'lorem', label: 'Lorem ipsum' }]}
          value={tab}
          onChange={setTab}
        />
      </Toolbar>
      <div className="tool__grid">
        <Panel
          title="Input"
          actions={
            <>
              <SampleButton onClick={() => setInput(tab === 'lines' ? 'banana\napple\ncherry\napple\n\ndate\nbanana' : 'convert this_text-to anyCase you LIKE')} />
              <ClearButton onClick={() => setInput('')} disabled={!input} />
            </>
          }
          footer={<Stats items={[['Chars', stats.chars], ['Words', stats.words], ['Lines', stats.lines]]} />}
        >
          <CodeArea value={input} onChange={setInput} wrap placeholder="Type or paste text…" />
        </Panel>

        {tab === 'case' && (
          <Panel title="Conversions" padded>
            {input ? (
              <div className="kv">
                {CASES.map((c) => (
                  <KV key={c.id} label={c.label} value={c.fn(input)} />
                ))}
              </div>
            ) : (
              <div className="empty-state">Each case conversion appears here as you type.</div>
            )}
          </Panel>
        )}

        {tab === 'lines' && (
          <Panel
            title="Line operations"
            actions={<CopyButton text={lineOut} />}
            footer={<Stats items={[['Input lines', lines.length], ['Output lines', lineOut ? lineOut.split('\n').length : 0]]} />}
          >
            <div className="row" style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              {LINE_OPS.map((op) => (
                <Button key={op.id} size="sm" onClick={() => setLineOut(op.fn(lines).join('\n'))} disabled={!input}>
                  {op.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setInput(lineOut)} disabled={!lineOut}>Use as input</Button>
            </div>
            <CodeOutput value={lineOut} placeholder="Pick an operation" />
          </Panel>
        )}

        {tab === 'stats' && (
          <Panel title="Statistics" padded>
            <div className="kv">
              <KV label="Characters" value={String(stats.chars)} copyable={false} />
              <KV label="Characters (no spaces)" value={String(stats.charsNoSpace)} copyable={false} />
              <KV label="Words" value={String(stats.words)} copyable={false} />
              <KV label="Lines" value={String(stats.lines)} copyable={false} />
              <KV label="Sentences" value={String(stats.sentences)} copyable={false} />
              <KV label="UTF-8 bytes" value={String(stats.bytes)} copyable={false} />
              <KV label="Reading time" value={`~${Math.max(1, Math.ceil(stats.words / 220))} min`} copyable={false} />
            </div>
          </Panel>
        )}

        {tab === 'lorem' && (
          <Panel
            title="Lorem ipsum"
            actions={
              <>
                <label className="row" style={{ gap: 6 }}>
                  <span className="muted">Paragraphs</span>
                  <input className="input" type="number" min={1} max={50} value={paras} onChange={(e) => setParas(Number(e.target.value) || 1)} style={{ width: 70 }} />
                </label>
                <CopyButton text={loremIpsum(paras)} />
              </>
            }
          >
            <CodeOutput value={loremIpsum(paras)} wrap />
          </Panel>
        )}
      </div>
    </div>
  );
}
