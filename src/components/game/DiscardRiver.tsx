import { Tile, type TileSize } from '../tiles/Tile';
import type { Tile as MahjongTile, TileId } from '../../domain/types';

export type DiscardRiverProps = {
  discards: TileId[];
  tileById: Record<string, MahjongTile>;
  className?: string;
  size?: TileSize;
  freshIndex?: number;
  limit?: number;
};

export function DiscardRiver({ discards, tileById, className = 'mj-play-disc-tiles', size = 'xs', freshIndex, limit }: DiscardRiverProps) {
  const showFrom = limit ? Math.max(0, discards.length - limit) : 0;
  const visibleDiscards = discards.slice(showFrom);

  return (
    <div className={className} data-role="discards">
      {visibleDiscards.map((id, visibleIndex) => {
        const tile = tileById[id];
        if (!tile) return null;
        const originalIndex = showFrom + visibleIndex;
        return <Tile key={`${id}-${originalIndex}`} tile={tile} size={size} button={false} fresh={freshIndex === originalIndex} />;
      })}
    </div>
  );
}
