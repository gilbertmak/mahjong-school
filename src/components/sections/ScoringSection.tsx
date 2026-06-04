export function ScoringSection() {
  return (
    <section id="section-faan" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: scoring">分</div>
        <h2 className="mj-h2">How is it <em>scored</em>?</h2>
        <p className="mj-lede" data-rs="scoringLede">Hong Kong scoring uses <em>faan</em> (番) — doubling units. Most tables require <strong>≥3 faan</strong> to declare, and patterns stack. A hand can score from several at once. Hands of 10 faan and up usually pay out as a &quot;limit&quot; hand.</p>
      </div>

      <div className="mj-scoring-fan">
        <strong>Minimum to win:</strong> <span data-rs="minSentence">3 faan, typical. Confirm before you sit — some friendly tables play 1 faan, some 5.</span>
        <em>Whatever the table agrees on beats any printed chart.</em>
      </div>

      <div className="mj-scoring-grid" id="faan-grid"></div>
    </section>
  );
}
