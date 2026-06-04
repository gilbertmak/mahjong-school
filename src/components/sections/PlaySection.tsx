export function PlaySection() {
  return (
    <section id="section-play" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: play a round">玩</div>
        <h2 className="mj-h2">Now <em>you</em> play.</h2>
        <p className="mj-lede">Take the <strong>East</strong> seat — you&apos;re the dealer — against three bots. You see your own tiles; theirs stay hidden, same as a real table. Draw each turn, then tap a tile to throw it. If someone discards something you can pung, chow or win on, you&apos;ll get the option. When the hand ends, you&apos;ll see exactly which patterns paid out.</p>
      </div>

      <div className="mj-play">
        <div className="mj-play-table" id="play-table"></div>
        <div className="mj-play-foot">
          <div className="mj-play-action" id="play-action"></div>
          <div className="mj-play-status" id="play-status"></div>
        </div>
      </div>
    </section>
  );
}
