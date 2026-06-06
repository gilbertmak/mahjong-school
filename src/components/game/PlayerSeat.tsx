import { Tile, type TileSize } from '../tiles/Tile';
import type { Tile as MahjongTile, TileId } from '../../domain/types';
import { DiscardRiver } from './DiscardRiver';

export type PlayerMeld = {
  type: string;
  tiles: TileId[];
};

export type PlayerSeatProps = {
  seatIndex: number;
  name: string;
  zh: string;
  hand: TileId[];
  discards: TileId[];
  melds?: PlayerMeld[];
  tileById: Record<string, MahjongTile>;
  variant?: 'demo' | 'play';
  isYou?: boolean;
  isDealer?: boolean;
  isActive?: boolean;
  isWinner?: boolean;
  hiddenHand?: boolean;
  actionable?: boolean;
  lastDiscardFresh?: boolean;
  discardLimit?: number;
  empty?: boolean;
  handSize?: TileSize;
  discardSize?: TileSize;
};

export function PlayerSeat({
  seatIndex,
  name,
  zh,
  hand,
  discards,
  melds = [],
  tileById,
  variant = 'play',
  isYou = false,
  isDealer = false,
  isActive = false,
  isWinner = false,
  hiddenHand = false,
  actionable = false,
  lastDiscardFresh = false,
  discardLimit,
  empty = false,
  handSize = variant === 'demo' ? 'xs' : 'sm',
  discardSize = 'xs',
}: PlayerSeatProps) {
  if (variant === 'demo') {
    const classes = ['mj-demo-seat'];
    if (empty) classes.push('is-empty');
    if (isActive) classes.push('is-active');
    if (isWinner) classes.push('is-winner');

    return (
      <div className={classes.join(' ')} data-seat={seatIndex}>
        <div className="mj-demo-seat-head">
          <span className="mj-demo-seat-wind">{name}<span className="mj-demo-seat-zh">{zh}</span></span>
          <span className="mj-demo-seat-label">{isDealer ? (empty ? 'dealer' : 'dealer · 莊') : ''}</span>
        </div>
        {empty ? (
          <div className="mj-demo-row mj-demo-row-empty">deal a round to begin,</div>
        ) : (
          <>
            <div className="mj-demo-row mj-demo-row-hand">
              <div className="mj-demo-tiles">
                {hand.map((id, index) => renderFaceTile(id, index, tileById, handSize))}
                {melds.map((meld, meldIndex) => (
                  <span key={`${meld.type}-${meldIndex}`} className={`mj-demo-meld mj-meld-${meld.type}`}>
                    {meld.tiles.map((id, tileIndex) => renderFaceTile(id, tileIndex, tileById, 'xs'))}
                  </span>
                ))}
              </div>
            </div>
            <div className="mj-demo-row mj-demo-row-discards">
              <span className="mj-demo-row-label">discards</span>
              <DiscardRiver
                discards={discards}
                tileById={tileById}
                className="mj-demo-tiles mj-demo-tiles-discard"
                size={discardSize}
                freshIndex={lastDiscardFresh ? discards.length - 1 : undefined}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  const classes = ['mj-play-seat', isYou ? 'is-you' : 'is-opp'];
  if (isActive) classes.push('is-active');
  if (isWinner) classes.push('is-winner');

  return (
    <div className={classes.join(' ')} data-seat={seatIndex}>
      <div className="mj-play-seat-head">
        <span className="mj-play-seat-name">{name}<span className="mj-play-seat-zh">{zh}</span></span>
        <span className="mj-play-seat-meta">{isDealer ? 'dealer 莊' : ''}{isYou ? ' · YOU' : ''}</span>
      </div>
      <div className="mj-play-hand-wrap">
        <div className="mj-play-hand-tiles" data-role="hand">
          {hiddenHand
            ? hand.map((_id, index) => <span key={`back-${index}`} className="mj-tile-back mj-tile--sm" aria-label="hidden tile" />)
            : hand.map((id, index) => renderFaceTile(id, index, tileById, handSize, actionable))}
          {melds.length ? (
            <span className="mj-play-melds">
              {melds.map((meld, meldIndex) => (
                <span key={`${meld.type}-${meldIndex}`} className={`mj-play-meld mj-meld-${meld.type}`}>
                  {meld.tiles.map((id, tileIndex) => renderFaceTile(id, tileIndex, tileById, 'sm'))}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mj-play-discards">
        <span className="mj-play-row-label">{isYou ? 'your discards' : 'discards'}</span>
        <DiscardRiver
          discards={discards}
          tileById={tileById}
          size={discardSize}
          freshIndex={lastDiscardFresh ? discards.length - 1 : undefined}
          limit={discardLimit}
        />
      </div>
    </div>
  );
}

function renderFaceTile(id: TileId, index: number, tileById: Record<string, MahjongTile>, size: TileSize, actionable = false) {
  const tile = tileById[id];
  return tile ? <Tile key={`${id}-${index}`} tile={tile} size={size} button={!actionable ? false : true} actionable={actionable} /> : null;
}
