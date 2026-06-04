import { Tile, type TileSize } from './Tile';
import type { Tile as MahjongTile, TileId } from '../../domain/types';

export type TileRowProps = {
  tileIds: TileId[];
  tileById: Record<string, MahjongTile>;
  size?: TileSize;
  gap?: number;
};

export function TileRow({ tileIds, tileById, size, gap = 3 }: TileRowProps) {
  return (
    <span style={{ display: 'inline-flex', gap: `${gap}px` }}>
      {tileIds.map((id, index) => {
        const tile = tileById[id];
        return tile ? <Tile key={`${id}-${index}`} tile={tile} size={size} button={false} /> : null;
      })}
    </span>
  );
}
