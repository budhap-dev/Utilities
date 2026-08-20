import { Link } from 'react-router-dom';
import { TOOLS, GROUPS } from '../registry';

export default function Home() {
  return (
    <div className="home">
      <div className="home__hero">
        <h1>Your daily developer toolbelt.</h1>
        <p>
          {TOOLS.length} focused utilities that run entirely in your browser. Nothing you paste ever leaves this
          machine. Press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> to jump to any tool.
        </p>
      </div>
      {GROUPS.map((group) => (
        <div key={group}>
          <div className="home__section-title">{group}</div>
          <div className="home__grid">
            {TOOLS.filter((t) => t.group === group).map((t) => {
              const Icon = t.icon;
              return (
                <Link key={t.id} to={`/tools/${t.id}`} className="home__card">
                  <div className="home__card-icon">
                    <Icon />
                  </div>
                  <div>
                    <h3>{t.name}</h3>
                    <p>{t.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
