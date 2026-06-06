export function ActionsSection() {
  return (
    <section id="section-actions" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: on your turn">打</div>
        <h2 className="mj-h2">What can you do each <em>turn</em>?</h2>
        <p className="mj-lede">On your go you <strong>draw one</strong> tile and <strong>let one go</strong>. That&apos;s the whole turn.
          In between, anyone can break in with a call: three of them simply claim a tile (chow, pung, kong), while the fourth, mahjong, ends the hand.</p>
      </div>

      <div className="mj-action-list" id="action-list"></div>

      <div className="mj-priority">
        <div className="mj-priority-h">Who wins a call, when more than one player wants the same tile</div>
        <div className="mj-priority-ladder" id="priority-ladder"></div>
      </div>
    </section>
  );
}
