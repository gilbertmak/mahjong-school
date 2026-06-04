import type { GameState, PlayerState, Ruleset, TileId } from './types';
import { TILE_BY_ID, tileCode } from './tiles';
import { classifySet, decomposeWin, isThirteenOrphans } from './handValidation';

export const FAAN_HK = [
  { name:'Common Hand', zh:'平糊', val:'1 faan', desc:'All chows, valueless pair.' },
  { name:'All Pungs', zh:'對對糊', val:'3 faan', desc:'Every set a pung or kong.' },
  { name:'Mixed One Suit', zh:'混一色', val:'3 faan', desc:'One suit plus any honors.' },
  { name:'Pure One Suit', zh:'清一色', val:'7 faan', desc:'A single suit, nothing else.' },
  { name:'Small Three Dragons', zh:'小三元', val:'3 faan', desc:'Two dragon pungs + dragon pair.' },
  { name:'Great Three Dragons', zh:'大三元', val:'8 faan', desc:'Pungs of all three dragons.' },
  { name:'All Honors', zh:'字一色', val:'10 faan', limit:true, desc:'Only winds and dragons.' },
  { name:'Thirteen Orphans', zh:'十三么', val:'13 faan', limit:true, desc:'One of every terminal + every honor + pair.' },
  { name:'Self-Draw', zh:'自摸', val:'+1 faan', desc:'Won on a self-drawn tile.' },
  { name:'All Concealed', zh:'門前清', val:'+1 faan', desc:'Hand never called pung/chow/kong.' },
  { name:'Dragon Pung', zh:'番牌', val:'+1 faan ea.', desc:'Each dragon pung adds 1 faan.' },
  { name:'Seat / Round Wind', zh:'番牌', val:'+1 faan ea.', desc:'Pung of your seat wind or the round wind.' },
  { name:'Flower of Seat', zh:'花牌', val:'+1 faan', desc:'Flower or season matching your seat (E=1, S=2, W=3, N=4).' },
];

export const FAAN_SG = [
  { name:'Chicken / Basic Mahjong', zh:'雞胡', val:'0 tai', desc:'A bare 4-sets-and-a-pair with no scoring elements. Most tables disallow it — need 1 tai minimum.' },
  { name:'All Chow', zh:'平胡', val:'1 tai', desc:'Every set is a chow, non-scoring pair. (4 tai if completely "pure" — no flowers/animals exposed.)' },
  { name:'All Pong', zh:'對對胡', val:'2 tai', desc:'Every set a pung or kong. Easier to spot mid-hand than HK.' },
  { name:'Half Color (Mixed)', zh:'混一色', val:'2 tai', desc:'One number suit plus honors only.' },
  { name:'Half Terminals', zh:'混老頭', val:'2 tai', desc:'Only 1s, 9s, and honors throughout the hand.' },
  { name:'Full Color (Pure)', zh:'清一色', val:'4 tai', desc:'A single suit, no honors.' },
  { name:'All Terminals', zh:'清老頭', val:'9 tai', limit:true, desc:'Only 1s and 9s — no middle tiles, no honors.' },
  { name:'Small Three Dragons', zh:'小三元', val:'2 tai', desc:'Two dragon pungs + dragon pair (the +1 tai dragon-pair counts separately).' },
  { name:'Great Three Dragons', zh:'大三元', val:'4 tai', desc:'Pungs of all three dragons. The discarder of the third dragon usually pays for everyone.' },
  { name:'All Honors', zh:'字一色', val:'10 tai', limit:true, desc:'Only winds and dragons. Limit hand.' },
  { name:'All Winds', zh:'大四喜', val:'limit', limit:true, desc:'Pungs of all four winds + any pair.' },
  { name:'Thirteen Wonders', zh:'十三么', val:'8 tai', desc:'One of every terminal + every honor + a pair.' },
  { name:'Self-Draw', zh:'自摸', val:'+1 tai', desc:'Won on a self-drawn tile.' },
  { name:'Concealed', zh:'門前清', val:'+1 tai', desc:'Hand never called pung/chow/kong.' },
  { name:'Each Dragon Pung', zh:'番牌', val:'+1 tai ea.', desc:'Each pung of dragons.' },
  { name:'Seat / Round Wind', zh:'番牌', val:'+1 tai ea.', desc:'Pung of your seat wind or the round wind.' },
  { name:'Each Animal', zh:'動物', val:'+1 tai ea.', desc:'Each animal tile (cat, rat, rooster, centipede) you hold at the end.' },
  { name:'All Four Animals', zh:'四動物', val:'limit', limit:true, desc:'Collect all four animals — pay-all limit hand.' },
  { name:'Matching Flower / Season', zh:'花牌', val:'+1 tai ea.', desc:'Flower or season matching your seat (E=1, S=2, W=3, N=4).' },
  { name:'Complete Flower Set', zh:'一色花', val:'+1 tai', desc:'All four of either the Flower group or the Season group.' },
  { name:'Seven Flowers / Seasons', zh:'七花', val:'10 tai', limit:true, desc:'Hold any 7 of the 8 bonus tiles and win on the 8th — instant.' },
  { name:'Eight Flowers / Seasons', zh:'八花', val:'limit', limit:true, desc:'Hold all 8 bonus tiles — instant win, pay-all.' },
  { name:'Robbing the Kong', zh:'搶槓', val:'+1 tai', desc:'Win on the tile someone adds to an exposed pung to make a kong.' },
  { name:'Win on Replacement', zh:'槓上開花', val:'+1 tai', desc:'After calling a kong, win on the replacement tile.' },
  { name:'Win on Last Tile', zh:'海底撈月', val:'+1 tai', desc:'Win on the final draw from the wall.' },
];

export const SCORE_VALUES_BY_RULESET = {
  sg: { thirteen: 8, honors: 10, great3: 4, small3: 2, pure: 4, mixed: 2, allpung: 2, common: 1, selfdraw: 1, concealed: 1, dragonpung: 1, seatwind: 1, roundwind: 1, cap: 5 },
  hk: { thirteen: 13, honors: 10, great3: 8, small3: 3, pure: 7, mixed: 3, allpung: 3, common: 1, selfdraw: 1, concealed: 1, dragonpung: 1, seatwind: 1, roundwind: 1, cap: null },
} as const;

export const SCORE_VALUES = SCORE_VALUES_BY_RULESET.hk;
export const WIND_TILE = ['we', 'ws', 'ww', 'wn'];
export const SEAT_NAMES = ['East', 'South', 'West', 'North'];

export function getFaanCatalog(ruleset: Ruleset) {
  return ruleset === 'sg' ? FAAN_SG : FAAN_HK;
}

export function getScoreValues(ruleset: Ruleset) {
  return SCORE_VALUES_BY_RULESET[ruleset];
}

function getPrimaryNames(ruleset: Ruleset) {
  return ruleset === 'sg' ? {
    honors: 'All Honors', great3: 'Great Three Dragons', pure: 'Full Color (Pure One Suit)', small3: 'Small Three Dragons', mixed: 'Half Color (Mixed One Suit)', allpung:'All Pong', common: 'All Chow',
  } : {
    honors: 'All Honors', great3: 'Great Three Dragons', pure: 'Pure One Suit', small3: 'Small Three Dragons', mixed: 'Mixed One Suit', allpung:'All Pungs', common: 'Common Hand',
  };
}

export interface ScorePattern { name: string; zh: string; faan: number; }
export interface ScoreResult { patterns: ScorePattern[]; total: number; raw?: number; capped?: boolean; }

export function computeFaan(player: PlayerState, game: GameState, ruleset: Ruleset = 'hk', seatNames = SEAT_NAMES): ScoreResult {
  const scoreValues = getScoreValues(ruleset);
  const primaryNames = getPrimaryNames(ruleset);
  const allTiles = [...player.hand, ...player.melds.flatMap(m => m.tiles)];
  const patterns: ScorePattern[] = [];

  if (isThirteenOrphans(allTiles)) {
    patterns.push({ name: 'Thirteen Orphans', zh: '十三么', faan: scoreValues.thirteen });
    return finaliseScore(patterns, ruleset);
  }

  const d = decomposeWin(allTiles);
  if (!d) return { patterns: [], total: 0 };

  let chows = 0;
  const pungTiles: TileId[] = [];
  for (const s of d.sets) {
    const k = classifySet(s);
    if (k === 'chow') chows++;
    else if (k === 'pung' || k === 'kong') pungTiles.push(s[0]);
  }

  const suits = new Set<number>();
  let hasHonor = false;
  for (const id of allTiles) {
    const c = tileCode(id);
    if (c >= 27) hasHonor = true;
    else suits.add(Math.floor(c / 9));
  }

  const dragonPungs = pungTiles.filter(id => ['dr','dg','dw'].includes(id));
  const dragonPair = ['dr','dg','dw'].includes(d.pair[0]);
  const pairTile = TILE_BY_ID[d.pair[0]];
  const seatWindId = WIND_TILE[player.seatIdx];
  const roundWindId = WIND_TILE[0];
  let primary: ScorePattern | null = null;

  if (suits.size === 0 && hasHonor) primary = { name: primaryNames.honors, zh: '字一色', faan: scoreValues.honors };
  else if (dragonPungs.length === 3) primary = { name: primaryNames.great3, zh: '大三元', faan: scoreValues.great3 };
  else if (suits.size === 1 && !hasHonor) primary = { name: primaryNames.pure, zh: '清一色', faan: scoreValues.pure };
  else if (dragonPungs.length === 2 && dragonPair) primary = { name: primaryNames.small3, zh: '小三元', faan: scoreValues.small3 };
  else if (suits.size === 1 && hasHonor) primary = { name: primaryNames.mixed, zh: '混一色', faan: scoreValues.mixed };
  else if (pungTiles.length === 4) primary = { name: primaryNames.allpung, zh: '對對胡', faan: scoreValues.allpung };
  else if (chows === 4 && pairTile && !pairTile.isHonor) {
    const valuePair = ['dr','dg','dw'].includes(d.pair[0]) || d.pair[0] === seatWindId || d.pair[0] === roundWindId;
    if (!valuePair) primary = { name: primaryNames.common, zh: '平胡', faan: scoreValues.common };
  }
  if (primary) patterns.push(primary);

  if (game.winSource === 'self-draw') patterns.push({ name: 'Self-Draw', zh: '自摸', faan: scoreValues.selfdraw });
  if (player.melds.length === 0) patterns.push({ name: 'Concealed', zh: '門前清', faan: scoreValues.concealed });

  if (!primary || (primary.zh !== '大三元' && primary.zh !== '小三元')) {
    for (const dp of dragonPungs) patterns.push({ name: `${TILE_BY_ID[dp].name} Pung`, zh: '番牌', faan: scoreValues.dragonpung });
  }
  if (pungTiles.includes(seatWindId)) patterns.push({ name: `Seat ${seatNames[player.seatIdx]} Pung`, zh: '番牌', faan: scoreValues.seatwind });
  if (seatWindId !== roundWindId && pungTiles.includes(roundWindId)) patterns.push({ name: 'Round East Pung', zh: '番牌', faan: scoreValues.roundwind });
  return finaliseScore(patterns, ruleset);
}

export function finaliseScore(patterns: ScorePattern[], ruleset: Ruleset = 'hk'): ScoreResult {
  const scoreValues = getScoreValues(ruleset);
  const raw = patterns.reduce((sum, p) => sum + p.faan, 0);
  let total = raw;
  let capped = false;
  if (scoreValues.cap && raw > scoreValues.cap) {
    total = scoreValues.cap;
    capped = true;
  }
  return { patterns, total, raw, capped };
}
