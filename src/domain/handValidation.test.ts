import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifySet, findWaits, isThirteenOrphans, isWinningHand } from './handValidation';
import type { TileId } from './types';

describe('Mahjong hand validation', () => {
  it('accepts a standard four-sets-and-a-pair hand', () => {
    const hand: TileId[] = ['d1', 'd2', 'd3', 'b4', 'b5', 'b6', 'c7', 'c8', 'c9', 'we', 'we', 'we', 'dr', 'dr'];

    assert.equal(isWinningHand(hand), true);
  });

  it('rejects unmatched honour tiles in an otherwise close hand', () => {
    const hand: TileId[] = ['d1', 'd2', 'd3', 'b4', 'b5', 'b6', 'c7', 'c8', 'c9', 'we', 'ws', 'ww', 'dr', 'dr'];

    assert.equal(isWinningHand(hand), false);
  });

  it('recognises thirteen orphans with one duplicated terminal or honour', () => {
    const hand: TileId[] = ['d1', 'd9', 'b1', 'b9', 'c1', 'c9', 'we', 'ws', 'ww', 'wn', 'dr', 'dg', 'dw', 'dw'];

    assert.equal(isThirteenOrphans(hand), true);
    assert.equal(isWinningHand(hand), true);
  });

  it('finds the only pair wait without suggesting a fifth copy', () => {
    const hand: TileId[] = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'b5', 'b5', 'b5', 'c2'];

    assert.deepEqual(findWaits(hand), ['c2']);
  });

  it('classifies chows, pungs, kongs, and invalid mixed-suit runs', () => {
    assert.equal(classifySet(['d1', 'd2', 'd3']), 'chow');
    assert.equal(classifySet(['we', 'we', 'we']), 'pung');
    assert.equal(classifySet(['dr', 'dr', 'dr', 'dr']), 'kong');
    assert.equal(classifySet(['d1', 'b2', 'c3']), 'invalid');
  });
});
