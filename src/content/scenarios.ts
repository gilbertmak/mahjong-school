import type { Scenario } from '../domain/types';

export function createScenarios(unit: string, isSingapore: boolean): Scenario[] {
  return [
    { prompt: 'Is this a winning hand?', hand: ['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','we','we','dr','dr'], options: [
      { label: 'Yes — it splits cleanly into 4 sets + a pair.', correct: true, explain: `Three chows (1-2-3 dots, 4-5-6 bamboo, 7-8-9 chars), a pung of East, a pair of Red Dragon. The East pung and Red pair both score ${unit}.` },
      { label: 'No — too many tile types.', correct: false, explain: 'A winning hand only needs the shape 4 sets + 1 pair. Suits and honors mix freely.' },
    ] },
    { prompt: 'And is this one?', hand: ['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','ws','ww','dr','dr'], options: [
      { label: 'Yes.', correct: false, explain: 'Look at the winds: East + South + West — three different singles. Honor tiles cannot form a chow, so this leaves three orphan tiles.' },
      { label: 'No — three lone winds don\'t form a set.', correct: true, explain: 'Right. Honors only combine as pairs, pungs or kongs. Three distinct winds is just three loose tiles.' },
    ] },
    { prompt: 'Second turn. You\'ve drawn a 14th tile. Which discard keeps the most options open?', hand: ['d2','d3','d4','b5','b6','b7','c3','c3','c4','c5','dr','dr','wn','f1'], options: [
      { label: 'Discard the Flower (Plum)', correct: false, explain: 'Trick option — flowers aren\'t discarded. They\'re set aside face-up and you draw a replacement.' },
      { label: 'Discard the lone North wind', correct: true, explain: 'It\'s isolated, you have just one, and unless North is your seat or the round wind, a pung of it scores nothing extra. Lone honors are the textbook early discard.' },
      { label: 'Discard a 3 of Characters', correct: false, explain: 'You already have c3-c3-c4-c5 — a pair plus a 4-5. Throwing a 3 of chars breaks both a potential pung and a chow.' },
      { label: 'Discard a Red Dragon', correct: false, explain: `You have a pair of dragons. Hold them — one more makes a pung worth 1 ${unit}, plus Dragon Pung value.` },
    ] },
    { prompt: 'The player to your left discards a 5 of Bamboo. Should you call chow?', hand: ['b3','b4','b6','b7','d2','d2','d2','c1','c2','c3','we','we','we','dr'], options: [
      { label: 'Yes — claim it for b3-b4-b5.', correct: false, explain: `You expose tiles for a 1-${unit} chow but forfeit the "All Concealed" +1 ${unit}, and the b6-b7 is still floating waiting for b5 or b8.` },
      { label: 'Yes — claim it for b4-b5-b6.', correct: false, explain: 'Same problem: you reveal tiles, lose the concealed bonus, and still have a stranded b3 and b7.' },
      { label: 'No — pass and stay concealed.', correct: true, explain: `You already have a pung of 2-dots, pung of East, chow 1-2-3 chars, and floating bamboo + a dragon. Stay closed and aim for a concealed win — much higher ${unit}.` },
    ] },
    { prompt: 'You\'re tenpai (ready). Which tile completes the hand?', hand: ['d1','d2','d3','d4','d5','d6','d7','d8','d9','b5','b5','b5','c2'], options: [
      { label: 'c1', correct: false, explain: 'c1 with your single c2 only forms 1-2 — no third tile in hand to extend it.' },
      { label: 'c2 — pair up the lone Two', correct: true, explain: 'You have three complete dot chows (1-2-3, 4-5-6, 7-8-9), a pung of 5-bamboo, and a lone c2. Pairing c2 finishes the hand. This is a tanki (pair) wait.' },
      { label: 'c1 or c3', correct: false, explain: 'You only have one 2 of chars and no neighbors. It can only pair up — it can\'t join a chow without partners.' },
    ] },
    { prompt: 'Your opponent just won with this hand. Which pattern scores?', hand: ['b1','b2','b3','b4','b5','b6','b7','b8','b9','b3','b3','b3','b5','b5'], options: [
      { label: 'Pure One Suit + All Pungs', correct: false, explain: 'Look at the sets: 1-2-3, 4-5-6, 7-8-9, 3-3-3, 5-5. Three chows, one pung, a pair — not All Pungs.' },
      { label: 'Pure One Suit (清一色)', correct: true, explain: `Every tile is bamboo. ${isSingapore ? 'Full Color (清一色) alone is 4 tai — well past the 1-tai minimum.' : 'Pure One Suit alone is 7 faan — well past the 3-faan minimum.'}` },
      { label: 'Common Hand only', correct: false, explain: 'Common Hand requires the pair to be non-scoring AND all sets to be chows. There\'s a pung here.' },
    ] },
    { prompt: 'Last few turns. The player across has called two pungs of dots and is clearly chasing one suit. Which discard is safest?', hand: ['d3','d5','b2','b2','b6','b7','b8','c4','c5','c6','c9','wn','wn','ws'], options: [
      { label: 'A 3 of Dots', correct: false, explain: 'They\'re collecting dots. Any dot is high-risk feed. Avoid.' },
      { label: 'The lone South wind', correct: false, explain: 'Honors are often safe — but if South is their seat or the round, you just gave them a pung. No South has been discarded yet to confirm it\'s safe.' },
      { label: 'A North wind (you already have a pair, and one was discarded earlier)', correct: true, explain: 'A tile already present in the discards is genbutsu — proven safe against most hands. Repeating a wind already thrown is the textbook defensive play.' },
    ] },
  ];
}
