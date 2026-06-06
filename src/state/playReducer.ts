export type RoundMode = 'idle' | 'playing' | 'awaiting-discard' | 'awaiting-call' | 'ended';

export interface PlayState {
  game: any;
  mode: RoundMode;
  speedMs: number;
  pendingCall: any;
  humanSeat: number;
  structureBuilt: boolean;
  eventCount: number;
  maxEvents: number;
}

export interface RoundTransitionDeps {
  newGame?: () => any;
  drawFromWall: (wall: any) => string | null;
  sortHand: (hand: string[]) => string[];
  discardSuggestion: (hand: string[]) => { id: string; reason: string };
  isWinningHand: (hand: string[]) => boolean;
}

type PlayAction =
  | { type: 'set-speed'; speedMs: number }
  | { type: 'start'; game: any }
  | { type: 'resign' }
  | { type: 'tick'; deps: RoundTransitionDeps }
  | { type: 'human-discard'; tileId: string }
  | { type: 'human-accept-call' }
  | { type: 'human-decline-call' }
  | { type: 'structure-built' };

export function createPlayInitialState(overrides: Partial<PlayState> = {}): PlayState {
  return {
    game: null,
    mode: 'idle',
    speedMs: 500,
    pendingCall: null,
    humanSeat: 0,
    structureBuilt: false,
    eventCount: 0,
    maxEvents: 280,
    ...overrides,
  };
}

function cloneGame(game: any): any {
  if (!game) return game;
  return {
    ...game,
    wall: game.wall ? { ...game.wall, tiles: [...game.wall.tiles] } : game.wall,
    players: game.players?.map((p: any) => ({
      ...p,
      hand: [...p.hand],
      melds: p.melds.map((m: any) => ({ ...m, tiles: [...m.tiles] })),
      discards: [...p.discards],
    })) ?? [],
    log: game.log ? [...game.log] : [],
    lastEvent: game.lastEvent ? { ...game.lastEvent } : game.lastEvent,
  };
}

const isSuitTileId = (id: string) => /^[dbc]\d$/.test(id);

export function flatHandForWin(player: any): string[] {
  const flat = [...player.hand];
  for (const m of player.melds) flat.push(...m.tiles);
  return flat;
}

export function checkChowOptions(handIds: string[], discardId: string): string[][] {
  if (!isSuitTileId(discardId)) return [];
  const prefix = discardId[0];
  const v = parseInt(discardId.slice(1), 10);
  const has = (id: string) => handIds.includes(id);
  const options: string[][] = [];
  if (v >= 3 && has(prefix+(v-2)) && has(prefix+(v-1))) options.push([prefix+(v-2), prefix+(v-1), discardId]);
  if (v >= 2 && v <= 8 && has(prefix+(v-1)) && has(prefix+(v+1))) options.push([prefix+(v-1), discardId, prefix+(v+1)]);
  if (v <= 7 && has(prefix+(v+1)) && has(prefix+(v+2))) options.push([discardId, prefix+(v+1), prefix+(v+2)]);
  return options;
}

/* Decide the best call response to the current discard.
   Priority: win > pung > chow. Equal priority, prefer the player
   closest to the discarder in turn order (offset 1 = next seat). */
export function findBestCall(game: any, deps: Pick<RoundTransitionDeps, 'isWinningHand'>): any {
  const discard = game.lastDiscard;
  const fromSeat = game.lastDiscardSeat;
  let best: any = null;
  const better = (c: any) => !best || c.priority < best.priority ||
    (c.priority === best.priority && c.turnOrder < best.turnOrder);

  for (let offset = 1; offset <= 3; offset++) {
    const i = (fromSeat + offset) % 4;
    const p = game.players[i];

    const winFlat = [...flatHandForWin(p), discard];
    if (winFlat.length === 14 && deps.isWinningHand(winFlat)) {
      const c = { player: i, kind: 'win', priority: 1, turnOrder: offset, tiles: [discard] };
      if (better(c)) best = c;
    }
    if (p.hand.filter((t: string) => t === discard).length >= 2) {
      const c = { player: i, kind: 'pung', priority: 2, turnOrder: offset, tiles: [discard, discard, discard] };
      if (better(c)) best = c;
    }
    if (offset === 1) {
      const opts = checkChowOptions(p.hand, discard);
      if (opts.length > 0) {
        const c = { player: i, kind: 'chow', priority: 3, turnOrder: offset, tiles: opts[0] };
        if (better(c)) best = c;
      }
    }
  }
  return best;
}

/* Execute a call against a cloned game state and sets lastEvent. */
export function executeCall(game: any, call: any): any {
  const p = game.players[call.player];
  if (call.kind === 'win') {
    game.phase = 'end';
    game.winner = call.player;
    game.winSource = 'discard';
    game.lastEvent = { type: 'win', player: call.player, tile: game.lastDiscard, source: 'discard', from: game.lastDiscardSeat };
    return game;
  }
  const tilesNeeded = call.kind === 'pung'
    ? [game.lastDiscard, game.lastDiscard]
    : call.tiles.filter((t: string) => t !== game.lastDiscard);
  for (const need of tilesNeeded) {
    const idx = p.hand.indexOf(need);
    if (idx >= 0) p.hand.splice(idx, 1);
  }
  p.melds.push({ type: call.kind, tiles: call.tiles.slice(), from: game.lastDiscardSeat });
  game.players[game.lastDiscardSeat].discards.pop();
  game.turn = call.player;
  game.phase = 'discard';
  game.lastEvent = { type: 'call', player: call.player, kind: call.kind, tiles: call.tiles, fromSeat: game.lastDiscardSeat, tile: game.lastDiscard };
  return game;
}

export function stepGame(game: any, deps: RoundTransitionDeps, humanSeat = -1): { game: any; event: any } {
  const next = cloneGame(game);
  if (!next || next.phase === 'end') return { game: next, event: null };
  if (next.phase === 'draw') {
    const t = deps.drawFromWall(next.wall);
    if (t === null) {
      next.phase = 'end';
      next.lastEvent = { type: 'exhausted' };
      return { game: next, event: next.lastEvent };
    }
    const p = next.players[next.turn];
    p.hand.push(t);
    p.hand = deps.sortHand(p.hand);
    if (deps.isWinningHand(flatHandForWin(p))) {
      next.phase = 'end';
      next.winner = next.turn;
      next.winSource = 'self-draw';
      next.winTile = t;
      next.lastEvent = { type: 'win', player: next.turn, tile: t, source: 'self-draw' };
      return { game: next, event: next.lastEvent };
    }
    next.phase = 'discard';
    next.lastEvent = { type: 'draw', player: next.turn, tile: t };
    return { game: next, event: next.lastEvent };
  }
  if (next.phase === 'east-discard' || next.phase === 'discard') {
    if (next.turn === humanSeat) {
      return { game: next, event: { type: 'awaiting-discard', player: humanSeat } };
    }
    const p = next.players[next.turn];
    if (p.hand.length === 0) {
      next.phase = 'end';
      next.lastEvent = { type: 'exhausted' };
      return { game: next, event: next.lastEvent };
    }
    const sugg = deps.discardSuggestion(p.hand);
    const idx = p.hand.indexOf(sugg.id);
    p.hand.splice(idx, 1);
    p.discards.push(sugg.id);
    next.lastDiscard = sugg.id;
    next.lastDiscardSeat = next.turn;
    next.phase = 'call';
    next.lastEvent = { type: 'discard', player: next.turn, tile: sugg.id, reason: sugg.reason };
    return { game: next, event: next.lastEvent };
  }
  if (next.phase === 'call') {
    const call = findBestCall(next, deps);
    if (call && call.player === humanSeat) {
      return { game: next, event: { type: 'awaiting-call', player: humanSeat, call } };
    }
    if (call) {
      executeCall(next, call);
      if (call.kind === 'win') next.winTile = next.lastDiscard;
      return { game: next, event: next.lastEvent };
    }
    next.turn = (next.turn + 1) % 4;
    next.phase = 'draw';
    next.lastEvent = { type: 'pass' };
    return { game: next, event: next.lastEvent };
  }
  return { game: next, event: null };
}

function capRound(state: PlayState): PlayState {
  const game = cloneGame(state.game);
  if (game) {
    game.phase = 'end';
    game.lastEvent = { type: 'exhausted' };
  }
  return { ...state, game, mode: 'ended' };
}

export function playReducer(state: PlayState, action: PlayAction): PlayState {
  switch (action.type) {
    case 'set-speed':
      return { ...state, speedMs: action.speedMs };
    case 'start':
      return { ...state, game: action.game, mode: 'playing', pendingCall: null, eventCount: 0, structureBuilt: false };
    case 'resign':
      return { ...state, game: null, mode: 'idle', pendingCall: null, structureBuilt: false, eventCount: 0 };
    case 'structure-built':
      return { ...state, structureBuilt: true };
    case 'tick': {
      if (state.mode !== 'playing' || !state.game) return state;
      let nextState = { ...state };
      let ev: any = null;
      let drains = 0;
      while (true) {
        const eventCount = nextState.eventCount + 1;
        if (eventCount > nextState.maxEvents) return capRound({ ...nextState, eventCount });
        const stepped = stepGame(nextState.game, action.deps, nextState.humanSeat);
        nextState = { ...nextState, game: stepped.game, eventCount };
        ev = stepped.event;
        if (!ev) return nextState;
        if (ev.type !== 'pass') break;
        if (++drains > 8) break;
      }
      if (ev.type === 'awaiting-discard') return { ...nextState, mode: 'awaiting-discard' };
      if (ev.type === 'awaiting-call') return { ...nextState, mode: 'awaiting-call', pendingCall: ev.call };
      if (ev.type === 'win' || ev.type === 'exhausted') return { ...nextState, mode: 'ended' };
      return nextState;
    }
    case 'human-discard': {
      if (state.mode !== 'awaiting-discard' || !state.game) return state;
      const game = cloneGame(state.game);
      const p = game.players[state.humanSeat];
      const idx = p.hand.indexOf(action.tileId);
      if (idx < 0) return state;
      p.hand.splice(idx, 1);
      p.discards.push(action.tileId);
      game.lastDiscard = action.tileId;
      game.lastDiscardSeat = state.humanSeat;
      game.phase = 'call';
      game.lastEvent = { type: 'discard', player: state.humanSeat, tile: action.tileId, reason: 'You discarded this.' };
      return { ...state, game, mode: 'playing' };
    }
    case 'human-accept-call': {
      if (state.mode !== 'awaiting-call' || !state.pendingCall || !state.game) return state;
      const game = cloneGame(state.game);
      executeCall(game, state.pendingCall);
      if (state.pendingCall.kind === 'win') game.winTile = game.lastDiscard;
      if (game.phase === 'end') return { ...state, game, pendingCall: null, mode: 'ended' };
      return { ...state, game, pendingCall: null, mode: 'awaiting-discard' };
    }
    case 'human-decline-call': {
      if (state.mode !== 'awaiting-call' || !state.game) return state;
      const game = cloneGame(state.game);
      game.turn = (game.lastDiscardSeat + 1) % 4;
      game.phase = 'draw';
      game.lastEvent = { type: 'pass' };
      return { ...state, game, pendingCall: null, mode: 'playing' };
    }
    default:
      return state;
  }
}

export function shouldSchedulePlay(state: PlayState): boolean {
  return state.mode === 'playing' && !!state.game;
}
