import type { TileId } from '../domain/types';

export interface ActionContent {
  zh: string;
  py: string;
  lit: string;
  name: string;
  desc: string;
  example: TileId[];
  timing: 'on-turn' | 'out-of-turn' | 'either';
  when: string;
}

export const createActions = (unit: string): ActionContent[] => [
  { zh:'摸牌', py:'mō pái', lit:'"feel for a tile"', name:'Draw', desc:'Take one tile from the wall, now you have 14 and must discard one.', example:[], timing:'on-turn', when:'Always, starts your turn' },
  { zh:'打牌', py:'dǎ pái', lit:'"strike a tile"', name:'Discard', desc:'Place one tile from your hand face-up in front of you. Your turn ends and other players may call it.', example:[], timing:'on-turn', when:'Always, ends your turn' },
  { zh:'上', py:'shàng', lit:'"go up"', name:'Chow', desc:'Claim the discarded tile to complete a sequence. Reveal the chow face-up.', example:['d3','d4','d5'], timing:'out-of-turn', when:'Only from the player on your left' },
  { zh:'碰', py:'pèng', lit:'"to bump"', name:'Pung', desc:'Claim a discard to complete a triplet (three of a kind). Reveal the pung face-up.', example:['b7','b7','b7'], timing:'out-of-turn', when:'Any player\'s discard' },
  { zh:'槓', py:'gàng', lit:'"to bar"', name:'Kong', desc:'Complete a set of four, from a discard, or from your own hand. Draw a replacement tile.', example:['c2','c2','c2','c2'], timing:'either', when:'Discard or self-draw' },
  { zh:'糊', py:'hú', lit:'"to win / paste"', name:'Mahjong', desc:`Declare the winning tile, either a self-draw or someone's discard, completing 4 sets + pair with enough ${unit}.`, example:['dr','dr'], timing:'either', when:'Any time the hand becomes complete' },
];

export const PRIORITY = [
  { rank:'1', name:'Mahjong (糊)', desc:'A declared win on a discard always beats any other call on that tile.' },
  { rank:'2', name:'Pung / Kong (碰/槓)', desc:'Beats a chow. If two players want to pung, the closer player to the discarder\'s right wins.' },
  { rank:'3', name:'Chow (上)', desc:'Only the player immediately after the discarder may call chow. Cannot interrupt a pung/kong on the same tile.' },
];
