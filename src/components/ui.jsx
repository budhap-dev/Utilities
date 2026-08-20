import { useCallback, useRef, useState } from 'react';
import useClipboard from '../hooks/useClipboard';
import { Copy, Trash, Sparkles, Upload } from './Icons';

export function Button({ variant, size, icon, active, className = '', children, ...rest }) {
  const cls = [
    'btn',
    variant && `btn--${variant}`,
    size && `btn--${size}`,
    icon && !children && 'btn--icon',
    active && 'btn--active',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function CopyButton({ text, label = 'Copy', size = 'sm', ...rest }) {
  const copy = useClipboard();
  return (
    <Button size={size} icon={<Copy width={14} height={14} />} onClick={() => copy(text)} disabled={!text} {...rest}>
      {label}
    </Button>
  );
}

export function ClearButton({ onClick, disabled, ...rest }) {
  return (
    <Button size="sm" variant="ghost" icon={<Trash width={14} height={14} />} onClick={onClick} disabled={disabled} {...rest}>
      Clear
    </Button>
  );
}

export function SampleButton({ onClick, ...rest }) {
  return (
    <Button size="sm" variant="ghost" icon={<Sparkles width={14} height={14} />} onClick={onClick} {...rest}>
      Sample
    </Button>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select({ options, value, onChange, ...rest }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ checked, onChange, children }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

export function Badge({ tone, children }) {
  return <span className={`badge${tone ? ` badge--${tone}` : ''}`}>{children}</span>;
}

export function Alert({ tone = 'info', children }) {
  return <div className={`alert alert--${tone}`}>{children}</div>;
}

export function Panel({ title, actions, footer, children, padded, className = '', style }) {
  return (
    <section className={`panel ${className}`} style={style}>
      {(title || actions) && (
        <header className="panel__header">
          {title && <span className="panel__title">{title}</span>}
          <span className="panel__spacer" />
          {actions}
        </header>
      )}
      <div className={`panel__body${padded ? ' panel__body--padded' : ''}`}>{children}</div>
      {footer && <footer className="panel__footer">{footer}</footer>}
    </section>
  );
}

export function Toolbar({ children }) {
  return <div className="toolbar">{children}</div>;
}

/**
 * Code-style textarea with optional file drop support.
 */
export function CodeArea({ value, onChange, placeholder, error, wrap, onFile, readOnly, ...rest }) {
  const [dragging, setDragging] = useState(false);
  const readFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => (onFile ? onFile(reader.result, file) : onChange(reader.result));
      reader.readAsText(file);
    },
    [onChange, onFile]
  );
  return (
    <textarea
      className={`codearea${wrap ? ' codearea--wrap' : ''}${error ? ' codearea--error' : ''}${dragging ? ' dropzone' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      readOnly={readOnly}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        readFile(e.dataTransfer.files?.[0]);
      }}
      {...rest}
    />
  );
}

export function CodeOutput({ value, wrap, placeholder, className = '' }) {
  if (!value) return <div className="empty-state">{placeholder || 'Output will appear here'}</div>;
  return <pre className={`code-output${wrap ? ' code-output--wrap' : ''} ${className}`}>{value}</pre>;
}

export function FileButton({ onFile, accept, children = 'Open file', ...rest }) {
  const ref = useRef(null);
  return (
    <>
      <Button size="sm" variant="ghost" icon={<Upload width={14} height={14} />} onClick={() => ref.current?.click()} {...rest}>
        {children}
      </Button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

export function KV({ label, value, muted, copyable = true }) {
  const copy = useClipboard();
  return (
    <>
      <span className="kv__label">{label}</span>
      <span className={`kv__value${muted ? ' kv__value--muted' : ''}`}>{value || '—'}</span>
      {copyable ? (
        <Button size="sm" variant="ghost" icon={<Copy width={14} height={14} />} onClick={() => copy(value)} disabled={!value} aria-label={`Copy ${label}`} />
      ) : (
        <span />
      )}
    </>
  );
}

export function Stats({ items }) {
  return (
    <div className="stats">
      {items.map(([k, v]) => (
        <span key={k}>
          {k}: <b>{v}</b>
        </span>
      ))}
    </div>
  );
}
