import { useTheme, THEMES } from '../hooks/useTheme';
import { Monitor, Sun, Moon, Waves, Contrast } from './Icons';

const ICONS = { system: Monitor, light: Sun, dark: Moon, ocean: Waves, contrast: Contrast };

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => {
        const Icon = ICONS[t.id];
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            className={theme === t.id ? 'active' : ''}
            title={t.label}
            onClick={() => setTheme(t.id)}
          >
            <Icon width={16} height={16} />
          </button>
        );
      })}
    </div>
  );
}
