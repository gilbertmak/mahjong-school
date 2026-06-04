import { useRulesetCopy } from '../../state/RulesetContext';

export function Footer() {
  const copy = useRulesetCopy();

  return (
    <footer className="mj-foot">
      <div className="mj-foot-brand">Mahjong for beginners</div>
      <div className="mj-foot-note">
        A beginner&apos;s visual guide — <span>{copy.variantName}</span>. Tiles rendered from Unicode (U+1F000–U+1F021);
        design language adapted from <a href="https://themahjong.guide/" target="_blank" rel="noopener" style={{ color: 'var(--ink-muted)' }}>themahjong.guide</a>.
        Works offline — just keep the three files (index.html, styles.css, app.js) together.
      </div>
    </footer>
  );
}
