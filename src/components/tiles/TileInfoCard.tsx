import { Tile } from './Tile';
import type { Tile as MahjongTile } from '../../domain/types';

export type TileInfoCardProps = {
  tile?: MahjongTile;
  role?: string;
};

export function TileInfoCard({ tile, role }: TileInfoCardProps) {
  if (!tile) {
    return (
      <aside className="mj-info-card" id="tile-info">
        <div className="mj-info-empty">
          <div className="mj-info-empty-h">Tap a tile</div>
          <div className="mj-info-empty-p">Pick any tile and its name, Chinese, pinyin and role show up right here.</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="mj-info-card" id="tile-info">
      <div className="mj-info-big" id="info-big"><Tile tile={tile} size="lg" button={false} /></div>
      <div className="mj-info-zh">{tile.zh}</div>
      <div className="mj-info-pinyin">{tile.pinyin}</div>
      <div className="mj-info-en">{tile.name}</div>
      <div className="mj-info-meta">{role}</div>
    </aside>
  );
}
