import { Tile, type TileSize } from './Tile';
import type { Tile as MahjongTile, TileId } from '../../domain/types';

export const MELD_LABELS: Record<string, { en: string; zh: string }> = {
  chow: { en: 'chow', zh: '上' },
  pung: { en: 'pung', zh: '碰' },
  kong: { en: 'kong', zh: '槓' },
  pair: { en: 'pair', zh: '眼' },
};

export type MeldProps = {
  tiles: TileId[];
  type: string;
  tileById: Record<string, MahjongTile>;
  size?: TileSize;
  showLabel?: boolean;
  className?: string;
};

export function Meld({ tiles, type, tileById, size = 'sm', showLabel = true, className }: MeldProps) {
  const info = MELD_LABELS[type] || { en: type, zh: '' };
  const classes = className || `mj-meld mj-meld-${type}`;

  return (
    <div className={classes}>
      <div className="mj-meld-tiles">
        {tiles.map((id, index) => {
          const tile = tileById[id];
          return tile ? <Tile key={`${id}-${index}`} tile={tile} size={size} button={false} /> : null;
        })}
      </div>
      {showLabel ? (
        <div className="mj-meld-label">
          <span>{info.en}</span><span className="mj-meld-label-zh">{info.zh}</span>
        </div>
      ) : null}
    </div>
  );
}
