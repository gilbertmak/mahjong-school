export function DemoSection() {
  return (
    <section id="section-demo" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: watch a round">觀</div>
        <h2 className="mj-h2">Watch a full <em>round</em>.</h2>
        <p className="mj-lede">Sit back while four bots play a hand from shuffle to finish — a win, or a dead wall. Every tile is shown, so you can watch each seat take shape, with a running caption on each draw, discard and call. Speed it up, slow it down, or step through one move at a time.</p>
      </div>

      <div className="mj-demo">
        <div className="mj-demo-controls">
          <button className="mj-btn mj-btn-primary" data-demo="play">▶ Deal a round</button>
          <button className="mj-btn" data-demo="pause" hidden>⏸ Pause</button>
          <button className="mj-btn" data-demo="step">⏭ Step</button>
          <button className="mj-btn" data-demo="restart" hidden>↺ Restart</button>
          <label className="mj-demo-speed">
            Speed
            <select data-demo="speed" defaultValue="700">
              <option value="1200">Slow</option>
              <option value="700">Normal</option>
              <option value="280">Fast</option>
            </select>
          </label>
        </div>

        <div className="mj-demo-table" id="demo-table"></div>

        <div className="mj-demo-foot">
          <div className="mj-demo-caption" id="demo-caption">Press <strong>Deal a round</strong> to begin.</div>
          <div className="mj-demo-status" id="demo-status"></div>
        </div>
      </div>
    </section>
  );
}
