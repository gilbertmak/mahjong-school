import type { MeldType, TileId } from './types';
import { codeToId, handToCounts, tileCode } from './tiles';

export function canFormSets(counts: number[], left: number): boolean {
  if (left === 0) return counts.every(c => c === 0);
  let i = 0; while (i < 34 && counts[i] === 0) i++;
  if (i === 34) return false;
  if (counts[i] >= 3) {
    counts[i] -= 3;
    if (canFormSets(counts, left - 1)) { counts[i] += 3; return true; }
    counts[i] += 3;
  }
  if (i < 27 && (i % 9) <= 6 && counts[i+1] > 0 && counts[i+2] > 0) {
    counts[i]--; counts[i+1]--; counts[i+2]--;
    if (canFormSets(counts, left - 1)) {
      counts[i]++; counts[i+1]++; counts[i+2]++;
      return true;
    }
    counts[i]++; counts[i+1]++; counts[i+2]++;
  }
  return false;
}

export function isThirteenOrphans(ids: TileId[]): boolean {
  const required = ['d1','d9','b1','b9','c1','c9','we','ws','ww','wn','dr','dg','dw'];
  if (ids.length !== 14) return false;
  const c: Record<string, number> = {};
  ids.forEach(id => { c[id] = (c[id]||0)+1; });
  let pair = false;
  for (const r of required) {
    if (!c[r]) return false;
    if (c[r] === 2) { if (pair) return false; pair = true; }
    else if (c[r] !== 1) return false;
  }
  for (const k of Object.keys(c)) if (!required.includes(k)) return false;
  return pair;
}

export function isWinningHand(ids: TileId[]): boolean {
  if (ids.length !== 14) return false;
  if (isThirteenOrphans(ids)) return true;
  const c = handToCounts(ids);
  for (let i = 0; i < 34; i++) {
    if (c[i] >= 2) {
      c[i] -= 2;
      if (canFormSets(c.slice(), 4)) { c[i] += 2; return true; }
      c[i] += 2;
    }
  }
  return false;
}

export function findWaits(ids: TileId[]): TileId[] {
  if (ids.length !== 13) return [];
  const waits: TileId[] = [];
  for (let i = 0; i < 34; i++) {
    const id = codeToId(i);
    const inHand = ids.filter(t => t === id).length;
    if (inHand >= 4) continue;
    if (isWinningHand([...ids, id])) waits.push(id);
  }
  return waits;
}

export interface WinDecomposition {
  pair: [TileId, TileId];
  sets: TileId[][];
}

export function decomposeWin(ids: TileId[]): WinDecomposition | null {
  if (ids.length !== 14) return null;
  const counts = handToCounts(ids);
  for (let p = 0; p < 34; p++) {
    if (counts[p] >= 2) {
      counts[p] -= 2;
      const sets: number[][] = [];
      if (collectSets(counts.slice(), 4, sets)) {
        const pairId = codeToId(p);
        return {
          pair: [pairId, pairId],
          sets: sets.map(set => set.map(codeToId)),
        };
      }
      counts[p] += 2;
    }
  }
  return null;
}

export function collectSets(counts: number[], left: number, out: number[][]): boolean {
  if (left === 0) return counts.every(c => c === 0);
  let i = 0; while (i < 34 && counts[i] === 0) i++;
  if (i === 34) return false;
  if (counts[i] >= 3) {
    counts[i] -= 3;
    out.push([i, i, i]);
    if (collectSets(counts, left - 1, out)) return true;
    out.pop();
    counts[i] += 3;
  }
  if (i < 27 && (i % 9) <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--; counts[i + 1]--; counts[i + 2]--;
    out.push([i, i + 1, i + 2]);
    if (collectSets(counts, left - 1, out)) return true;
    out.pop();
    counts[i]++; counts[i + 1]++; counts[i + 2]++;
  }
  return false;
}

export function classifySet(tiles: TileId[]): MeldType {
  if (tiles.length === 4 && tiles.every(t => t === tiles[0])) return 'kong';
  if (tiles.length === 3 && tiles[0] === tiles[1] && tiles[1] === tiles[2]) return 'pung';
  if (tiles.length === 3) {
    const codes = tiles.map(tileCode).sort((a, b) => a - b);
    if (codes[0] >= 0 && codes[0] < 27) {
      const suit = Math.floor(codes[0] / 9);
      const allSame = codes.every(c => Math.floor(c / 9) === suit);
      if (allSame && codes[1] === codes[0] + 1 && codes[2] === codes[0] + 2) return 'chow';
    }
  }
  return 'invalid';
}
