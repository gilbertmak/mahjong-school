import { RoundTransitionDeps, stepGame } from './playReducer';

export type DemoMode = 'idle' | 'playing' | 'paused' | 'ended';

export interface DemoState {
  game: any;
  mode: DemoMode;
  speedMs: number;
}

type DemoAction =
  | { type: 'set-speed'; speedMs: number }
  | { type: 'play'; game?: any }
  | { type: 'pause' }
  | { type: 'step'; game?: any; deps: RoundTransitionDeps; pause?: boolean }
  | { type: 'restart' };

export function createDemoInitialState(overrides: Partial<DemoState> = {}): DemoState {
  return {
    game: null,
    mode: 'idle',
    speedMs: 700,
    ...overrides,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'set-speed':
      return { ...state, speedMs: action.speedMs };
    case 'play':
      if (state.mode === 'idle' || state.mode === 'ended') return { ...state, game: action.game, mode: 'playing' };
      if (state.mode === 'paused') return { ...state, mode: 'playing' };
      return state;
    case 'pause':
      return state.mode === 'playing' ? { ...state, mode: 'paused' } : state;
    case 'restart':
      return { ...state, game: null, mode: 'idle' };
    case 'step': {
      if (state.mode === 'idle' || state.mode === 'ended') {
        return { ...state, game: action.game, mode: 'paused' as DemoMode };
      }
      const startState = { ...state, mode: state.mode === 'playing' && action.pause ? 'paused' as DemoMode : state.mode };
      if (!startState.game) return startState;
      let nextGame = startState.game;
      let ev: any = null;
      let drains = 0;
      do {
        const stepped = stepGame(nextGame, action.deps);
        nextGame = stepped.game;
        ev = stepped.event;
        if (!ev) return { ...startState, game: nextGame };
        drains++;
      } while (ev.type === 'pass' && drains <= 8);
      const ended = ev.type === 'win' || ev.type === 'exhausted';
      return { ...startState, game: nextGame, mode: ended ? 'ended' : startState.mode };
    }
    default:
      return state;
  }
}

export function shouldScheduleDemo(state: DemoState): boolean {
  return state.mode === 'playing' && !!state.game;
}
