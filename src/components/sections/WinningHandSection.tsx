import { useRulesetCopy } from '../../state/RulesetContext';

export function WinningHandSection() {
  const copy = useRulesetCopy();

  return (
    <section id="section-win" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: the winning hand">糊</div>
        <h2 className="mj-h2">How do you <em>win</em>?</h2>
        <p className="mj-lede">A finished hand is fourteen tiles split into <strong>four sets and a single pair</strong>.
          A set is either a run of three in one suit (a chow), three of a kind (a pung), or four (a kong).
          And before you can call it, the hand has to be worth at least <strong><span>{copy.min}</span> <span>{copy.unit}</span></strong>
          from the patterns below — so they&apos;re worth learning.</p>
      </div>

      <div className="mj-hand-reveal">
        <div className="mj-hand-accordion" id="hand-accordion"></div>
        <div className="mj-hand-stage" id="hand-stage"></div>
      </div>

      <div className="mj-vi-block">
        <div className="mj-vi-head">
          <h3 className="mj-h3">Spot the difference</h3>
          <p className="mj-vi-sub">Beginners stumble most on what really counts as a set. Here are the shapes that pass — and the look-alikes that don&apos;t.</p>
        </div>
        <div className="mj-vi-cols">
          <div className="mj-vi-valid">
            <div className="mj-vi-col-head"><span className="mj-vi-check">✓</span> These are real sets</div>
            <div id="vi-valid"></div>
          </div>
          <div className="mj-vi-invalid">
            <div className="mj-vi-col-head"><span className="mj-vi-check">✗</span> These are not</div>
            <div id="vi-invalid"></div>
          </div>
        </div>
      </div>

      <div className="mj-sandbox">
        <div className="mj-sandbox-head">
          <h3 className="mj-h3">Build one yourself</h3>
          <p>Tap tiles from the palette into the four set slots and the pair. Each slot calls out what you&apos;ve built — chow, pung or pair — as you go. Lay down all fourteen and the bar underneath tells you whether the hand would actually win.</p>
        </div>
        <div id="sandbox"></div>
      </div>
    </section>
  );
}
