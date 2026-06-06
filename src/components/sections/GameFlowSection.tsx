import { useRulesetCopy } from '../../state/RulesetContext';

export function GameFlowSection() {
  const copy = useRulesetCopy();

  return (
    <section id="section-flow" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: setting up">局</div>
        <h2 className="mj-h2">How do you <em>draw</em> &amp; <em>deal</em>?</h2>
        <p className="mj-lede">There&apos;s a bit of setup first: shuffle the tiles, stack them into a wall, crack it open
          with the dice, then hand out 13 to each player, with one spare going to the dealer for a starting 14.</p>
      </div>

      <div className="mj-dealer-card">
        <div className="mj-dealer-item">
          <div className="mj-dealer-item-h">Pick the dealer</div>
          <p>Everyone throws two dice. Whoever rolls <strong>highest</strong> takes the <em>East</em> seat for the
            opening hand; if there&apos;s a tie, only the tied players roll again.</p>
        </div>
        <div className="mj-dealer-divider"></div>
        <div className="mj-dealer-item">
          <div className="mj-dealer-item-h">Seating</div>
          <p>Each seat takes a <em>wind</em>, East, with South to its right, then West, then North.
            Play runs anti-clockwise around the table.</p>
        </div>
        <div className="mj-dealer-divider"></div>
        <div className="mj-dealer-item">
          <div className="mj-dealer-item-h">Rotation</div>
          <p>Win as East and you keep the seat; otherwise East <strong>passes</strong> to the next player.
            The round&apos;s prevailing wind shifts once every four full go-arounds.</p>
        </div>
      </div>

      <div className="mj-draw-steps">
        <div className="mj-draw-step">
          <div className="mj-draw-step-num">1</div>
          <div className="mj-draw-step-content">
            <div className="mj-draw-step-title">Build the wall</div>
            <p>Shuffle all <span>{copy.tilecount}</span> tiles face-down, then build a square wall in front of the four players, two tiles high, 34 stacks to a side.</p>
          </div>
        </div>
        <div className="mj-draw-step">
          <div className="mj-draw-step-num">2</div>
          <div className="mj-draw-step-content">
            <div className="mj-draw-step-title">Break the wall</div>
            <p>The dealer rolls once more and counts that many seats round from East; that seat&apos;s wall is where you break in. Count the same number of stacks from its right end, dealing starts there.</p>
            <div className="mj-draw-step-note"><strong>Why?</strong> It scrambles the starting point, so no one can read the wall ahead of time.</div>
          </div>
        </div>
        <div className="mj-draw-step">
          <div className="mj-draw-step-num">3</div>
          <div className="mj-draw-step-content">
            <div className="mj-draw-step-title">Deal 13 to each</div>
            <p>Going anti-clockwise, each player takes tiles in blocks of four. Three passes leaves everyone on twelve; one more tile each makes thirteen, except <strong>East takes two</strong>, opening with fourteen.</p>
          </div>
        </div>
        <div className="mj-draw-step">
          <div className="mj-draw-step-num">4</div>
          <div className="mj-draw-step-content">
            <div className="mj-draw-step-title">Set aside bonuses</div>
            <p>{copy.bonusReveal}</p>
            <div className="mj-draw-step-note">{copy.bonusNote}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
