import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTools } from '../registry';

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const results = useMemo(() => searchTools(q), [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => setIndex(0), [q]);

  if (!open) return null;

  const go = (tool) => {
    if (!tool) return;
    navigate(`/tools/${tool.id}`);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      go(results[index]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="palette__backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette__input"
          placeholder="Search tools… (e.g. json, epoch, diff)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="palette__list">
          {results.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className={`palette__item${i === index ? ' active' : ''}`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => go(t)}
              >
                <Icon />
                <span>{t.name}</span>
                <span className="palette__item-group">{t.group}</span>
              </div>
            );
          })}
          {!results.length && <div className="palette__empty">No tools found</div>}
        </div>
        <div className="palette__footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
