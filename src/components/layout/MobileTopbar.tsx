import { Brand } from './Brand';
import { navItems } from './navigation';

export function MobileTopbar() {
  return (
    <header className="mj-topbar-mobile">
      <div className="mj-topbar-mobile-row">
        <Brand />
        <button className="mj-menu-btn" aria-label="Toggle menu">
          <span className="mj-menu-btn-label">What are the tiles?</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
      <nav className="mj-nav-mobile">
        {navItems.map((item) => (
          <a href={item.href} key={item.href}>{item.label}</a>
        ))}
      </nav>
    </header>
  );
}
