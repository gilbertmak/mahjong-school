import { SUIT } from '../../domain/tiles';
import type { Tile as MahjongTile, TileId } from '../../domain/types';

export type TileSize = 'xs' | 'sm' | 'lg';

export type TileProps = {
  tile: MahjongTile;
  size?: TileSize;
  button?: boolean;
  selected?: boolean;
  actionable?: boolean;
  fresh?: boolean;
};

const SVG_CJK_FONT = "'Songti SC','Source Han Serif SC','Noto Serif CJK SC','SimSun','Songti TC','MingLiU',serif";
const HONOR_INK: Partial<Record<TileId, string>> = {
  we: '#23302c', ws: '#23302c', ww: '#23302c', wn: '#23302c',
  dr: '#b23a2c', dg: '#2f6e54', dw: '#3f6075',
};

export function honorTileSVG(tile: MahjongTile): string {
  const fill = HONOR_INK[tile.id] || '#23302c';
  const ch = tile.zh;
  return `<svg class="mj-tile-svg" viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="1.75" y="1.75" width="96.5" height="126.5" rx="13" fill="#fbfaf6" stroke="#cdc8b8" stroke-width="1.5"/>
  <rect x="6" y="6" width="88" height="30" rx="9" fill="#ffffff" opacity="0.45"/>
  <text x="51.5" y="95" text-anchor="middle" font-family="${SVG_CJK_FONT}" font-weight="700" font-size="76" fill="rgba(31,28,24,0.15)">${ch}</text>
  <text x="50" y="93" text-anchor="middle" font-family="${SVG_CJK_FONT}" font-weight="700" font-size="76" fill="${fill}">${ch}</text>
</svg>`;
}

export function tileClassName(tile: MahjongTile, props: Pick<TileProps, 'size' | 'selected' | 'actionable' | 'fresh'> = {}): string {
  const classes = ['mj-tile', `mj-tile--${tile.suit}`];
  if (tile.suit === SUIT.DRAGON) classes.push(`mj-tile--dragon-${tile.dragonColor}`);
  if (props.size) classes.push(`mj-tile--${props.size}`);
  if (props.selected) classes.push('is-selected');
  if (props.actionable) classes.push('is-actionable');
  if (props.fresh) classes.push('is-fresh');
  return classes.join(' ');
}

export function Tile({ tile, size, button = true, selected = false, actionable = false, fresh = false }: TileProps) {
  const Tag = button ? 'button' : 'span';
  const content = tile.suit === SUIT.WIND || tile.suit === SUIT.DRAGON
    ? { __html: honorTileSVG(tile) }
    : { __html: `<span class="mj-tile-glyph" aria-hidden="true">${tile.glyph}</span>` };

  return (
    <Tag
      type={button ? 'button' : undefined}
      className={tileClassName(tile, { size, selected, actionable, fresh })}
      aria-label={tile.name}
      data-tile-id={tile.id}
      style={button ? undefined : { cursor: 'default' }}
      dangerouslySetInnerHTML={content}
    />
  );
}
