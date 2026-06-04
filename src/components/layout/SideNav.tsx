import { useRuleset } from '../../state/RulesetContext';
import { Brand } from './Brand';
import { navItems } from './navigation';

export function SideNav() {
  const { ruleset, setRuleset } = useRuleset();

  return (
    <aside className="mj-sidenav" aria-label="Section navigation">
      <Brand />
      <nav className="mj-nav">
        {navItems.map((item, index) => (
          <a href={item.href} className={index === 0 ? 'is-active' : undefined} key={item.href}>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="mj-theme-picker">
        <div className="mj-theme-label">Ruleset</div>
        <button
          className={`mj-theme-btn${ruleset === 'hk' ? ' is-active' : ''}`}
          type="button"
          onClick={() => setRuleset('hk')}
        >
          Hong Kong
        </button>
        <button
          className={`mj-theme-btn${ruleset === 'sg' ? ' is-active' : ''}`}
          type="button"
          onClick={() => setRuleset('sg')}
        >
          Singapore
        </button>
      </div>
    </aside>
  );
}
