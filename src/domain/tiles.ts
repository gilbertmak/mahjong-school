import type { Ruleset, Tile, TileId } from './types';

export const SUIT = {
  DOTS: 'dots', BAM: 'bamboo', CHAR: 'chars',
  WIND: 'wind', DRAGON: 'dragon',
  FLOWER: 'flower', SEASON: 'season',
  ANIMAL: 'animal',
} as const;

const NUM_EN = ['One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
const NUM_PY = ['yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];

export function createTiles(ruleset: Ruleset = 'hk'): Tile[] {
  const out: Tile[] = [];
  const gDots = ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'];
  const gBam  = ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'];
  const gChar = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'];
  for (let i = 1; i <= 9; i++) {
    out.push({ id:'d'+i, suit:SUIT.DOTS, group:'suit', value:i, glyph:gDots[i-1], name: NUM_EN[i-1]+' of Dots', zh:i+'筒', pinyin:NUM_PY[i-1]+' tǒng', isTerminal: i===1||i===9 });
    out.push({ id:'b'+i, suit:SUIT.BAM, group:'suit', value:i, glyph:gBam[i-1], name: NUM_EN[i-1]+' of Bamboo', zh:i+'條', pinyin:NUM_PY[i-1]+' tiáo', isTerminal: i===1||i===9 });
    out.push({ id:'c'+i, suit:SUIT.CHAR, group:'suit', value:i, glyph:gChar[i-1], name: NUM_EN[i-1]+' of Characters', zh:i+'萬', pinyin:NUM_PY[i-1]+' wàn', isTerminal: i===1||i===9 });
  }
  ([['we','East','東','dōng'], ['ws','South','南','nán'], ['ww','West','西','xī'], ['wn','North','北','běi']] as const).forEach(([id,en,zh,py]) => {
    out.push({ id, suit:SUIT.WIND, group:'honor', value:id[1], glyph:zh, name: en+' Wind', zh, pinyin:py, isHonor:true });
  });
  ([['dr','Red Dragon','中','zhōng','r'], ['dg','Green Dragon','發','fā','g'], ['dw','White Dragon','白','bái','w']] as const).forEach(([id,en,zh,py,col]) => {
    out.push({ id, suit:SUIT.DRAGON, group:'honor', value:id[1], glyph:zh, dragonColor:col, name: en, zh, pinyin:py, isHonor:true });
  });
  ([['f1','Plum','梅','méi','🀦'], ['f2','Orchid','蘭','lán','🀧'], ['f3','Chrysanthemum','菊','jú','🀨'], ['f4','Bamboo Flower','竹','zhú','🀩']] as const).forEach(([id,en,zh,py,gl]) => {
    out.push({ id, suit:SUIT.FLOWER, group:'bonus', value:+id[1], glyph:gl, name:en, zh, pinyin:py, isBonus:true });
  });
  ([['s1','Spring','春','chūn','🀢'], ['s2','Summer','夏','xià','🀣'], ['s3','Autumn','秋','qiū','🀤'], ['s4','Winter','冬','dōng','🀥']] as const).forEach(([id,en,zh,py,gl]) => {
    out.push({ id, suit:SUIT.SEASON, group:'bonus', value:+id[1], glyph:gl, name:en, zh, pinyin:py, isBonus:true });
  });
  if (ruleset === 'sg') {
    ([['x1','Cat','貓','māo','貓','mouse'], ['x2','Rat','鼠','shǔ','鼠','cat'], ['x3','Rooster','雞','jī','雞','centipede'], ['x4','Centipede','蜈蚣','wú gōng','蜈','rooster']] as const).forEach(([id,en,zh,py,gl,prey]) => {
      out.push({ id, suit: SUIT.ANIMAL, group: 'animal', value: +id[1], glyph: gl, name: en, zh, pinyin: py, isAnimal: true, isBonus: true, pairWith: prey });
    });
  }
  return out;
}

export const TILES_HK = createTiles('hk');
export const TILES_SG = createTiles('sg');
export const TILES = TILES_HK;
export const TILE_BY_ID = Object.fromEntries(TILES_SG.map(t => [t.id, t])) as Record<TileId, Tile>;
export const PLAYABLE_TILE_IDS = TILES_HK.filter(t => t.group !== 'bonus' && t.group !== 'animal').map(t => t.id);

export function tilesForRuleset(ruleset: Ruleset): Tile[] {
  return ruleset === 'sg' ? TILES_SG : TILES_HK;
}

export function tileByIdForRuleset(ruleset: Ruleset): Record<TileId, Tile> {
  return Object.fromEntries(tilesForRuleset(ruleset).map(t => [t.id, t])) as Record<TileId, Tile>;
}

export function tileCode(id: TileId): number {
  const honors: Record<string, number> = { we:27, ws:28, ww:29, wn:30, dr:31, dg:32, dw:33 };
  if (id in honors) return honors[id];
  if (id[0] === 'd') return +id.slice(1) - 1;
  if (id[0] === 'b') return 9 + +id.slice(1) - 1;
  if (id[0] === 'c') return 18 + +id.slice(1) - 1;
  return -1;
}

export function codeToId(c: number): TileId {
  if (c < 9)  return 'd'+(c+1);
  if (c < 18) return 'b'+(c-9+1);
  if (c < 27) return 'c'+(c-18+1);
  return ['we','ws','ww','wn','dr','dg','dw'][c-27];
}

export function handToCounts(ids: TileId[]): number[] {
  const c = new Array(34).fill(0);
  ids.forEach(id => { const k = tileCode(id); if (k >= 0) c[k]++; });
  return c;
}
