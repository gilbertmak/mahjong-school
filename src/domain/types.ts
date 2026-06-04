export type Ruleset = 'hk' | 'sg';
export type TileId = string;

export type TileSuit = 'dots' | 'bamboo' | 'chars' | 'wind' | 'dragon' | 'flower' | 'season' | 'animal';
export type TileGroup = 'suit' | 'honor' | 'bonus' | 'animal';

export interface Tile {
  id: TileId;
  suit: TileSuit;
  group: TileGroup;
  value: number | string;
  glyph: string;
  name: string;
  zh: string;
  pinyin: string;
  isTerminal?: boolean;
  isHonor?: boolean;
  isBonus?: boolean;
  isAnimal?: boolean;
  dragonColor?: string;
  pairWith?: string;
}

export type MeldType = 'chow' | 'pung' | 'kong' | 'pair' | 'invalid';

export interface Meld {
  type?: MeldType;
  tiles: TileId[];
  fromSeat?: number;
  concealed?: boolean;
}

export interface HandPattern {
  id?: string;
  zh: string;
  name: string;
  pts?: string;
  ptsSG?: string;
  desc: string;
  sets?: TileId[][];
  pair?: TileId[];
  flat?: TileId[];
  formula: string;
}

export interface ScenarioOption {
  label: string;
  correct: boolean;
  explain: string;
}

export interface Scenario {
  prompt: string;
  hand: TileId[];
  options: ScenarioOption[];
}

export interface PlayerState {
  seatIdx: number;
  hand: TileId[];
  melds: Meld[];
  discards?: TileId[];
  bonus?: TileId[];
  drawn?: TileId | null;
}

export interface GameState {
  players: PlayerState[];
  turn: number;
  wall?: TileId[];
  lastDiscard?: TileId | null;
  lastDiscardSeat?: number | null;
  winSource?: 'self-draw' | 'discard' | string;
  winTile?: TileId | null;
  winner?: number | null;
}
