import { useRulesetCopy } from '../../state/RulesetContext';

export function ScoringSection() {
  const copy = useRulesetCopy();

  return (
    <section id="section-faan" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: scoring">分</div>
        <h2 className="mj-h2">How is it <em>scored</em>?</h2>
        <p className="mj-lede">{copy.scoringLede}</p>
      </div>

      <div className="mj-scoring-fan">
        <strong>Minimum to win:</strong> <span>{copy.minSentence}</span>
        <em>Whatever the table agrees on beats any printed chart.</em>
      </div>

      <div className="mj-scoring-grid" id="faan-grid"></div>
    </section>
  );
}
