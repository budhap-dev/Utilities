import ThemeSwitcher from './ThemeSwitcher';
import { Button } from './ui';
import { PanelLeft, Search } from './Icons';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function TopBar({ tool, onToggleSidebar, onOpenPalette }) {
  return (
    <header className="topbar">
      <Button variant="ghost" icon={<PanelLeft />} onClick={onToggleSidebar} aria-label="Toggle sidebar" />
      <div>
        <div className="topbar__title">{tool ? tool.name : 'Home'}</div>
        {tool && <div className="topbar__desc">{tool.description}</div>}
      </div>
      <div className="topbar__spacer" />
      <button type="button" className="topbar__kbd-hint" onClick={onOpenPalette}>
        <Search width={14} height={14} />
        <span>Jump to tool…</span>
        <span style={{ marginLeft: 'auto' }}>
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd> <kbd>K</kbd>
        </span>
      </button>
      <ThemeSwitcher />
    </header>
  );
}
