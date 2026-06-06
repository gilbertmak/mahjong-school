export function DrillsSection() {
  return (
    <section id="section-drills" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: random drills">隨</div>
        <h2 className="mj-h2">Practise on random <em>hands</em>.</h2>
        <p className="mj-lede">Three exercises built on randomly dealt tiles, so a brand-new hand turns up on every click. The checker answers instantly, keep at it until the shapes jump out without you thinking.</p>
      </div>

      <div className="mj-drill-tabs" role="tablist">
        <button className="mj-drill-tab is-active" data-drill="waits" role="tab">Find the wait</button>
        <button className="mj-drill-tab" data-drill="winornot" role="tab">Win or not?</button>
        <button className="mj-drill-tab" data-drill="discard" role="tab">Best discard</button>
      </div>

      <div className="mj-drill" id="drill"></div>
    </section>
  );
}
