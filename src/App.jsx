import { Suspense, useCallback, useEffect, useState } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import Home from './components/Home';
import { getTool } from './registry';
import useLocalStorage from './hooks/useLocalStorage';

function ToolView() {
  const { id } = useParams();
  const tool = getTool(id);
  if (!tool) return <Navigate to="/" replace />;
  const Component = tool.component;
  return (
    <Suspense fallback={<div className="empty-state">Loading {tool.name}…</div>}>
      <Component key={tool.id} />
    </Suspense>
  );
}

function Shell({ children }) {
  const [collapsed, setCollapsed] = useLocalStorage('sidebar.collapsed', false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { id } = useParams();
  const tool = id ? getTool(id) : null;

  const onKey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setPaletteOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  useEffect(() => {
    document.title = tool ? `${tool.name} · DevKit` : 'DevKit';
  }, [tool]);

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <TopBar tool={tool} onToggleSidebar={() => setCollapsed((c) => !c)} onOpenPalette={() => setPaletteOpen(true)} />
      <main className="main">{children}</main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell>
            <Home />
          </Shell>
        }
      />
      <Route
        path="/tools/:id"
        element={
          <Shell>
            <ToolView />
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
