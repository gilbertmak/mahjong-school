import { TileInfoCard } from '../tiles/TileInfoCard';

export function TileExplorerSection() {
  return (
    <section id="section-tiles" className="mj-section">
      <div className="mj-section-head">
        <div className="mj-kicker" aria-label="Section: the tiles">牌</div>
        <h2 className="mj-h2">What are the <em>tiles</em>?</h2>
        <p className="mj-lede">The set breaks into three counting suits — Dots, Bamboo and Characters — each numbered
          one to nine with four copies apiece. Above those sit the honours: four <strong>winds</strong> and
          three <strong>dragons</strong>. Then eight bonus tiles, the <em>flowers</em> and <em>seasons</em>.
          Tap a tile to read its name, its Chinese, and what it does.</p>
      </div>

      <div className="mj-tile-explorer">
        <div className="mj-pills" id="tile-pills"></div>
        <div className="mj-tile-grid-wrap">
          <div className="mj-tile-grid" id="tile-grid"></div>
          <TileInfoCard />
        </div>
      </div>
    </section>
  );
}
