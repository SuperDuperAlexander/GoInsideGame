import { bus } from './events';

export type GameState =
  | 'boot'
  | 'start'
  | 'picker'
  | 'opening'
  | 'outer'
  | 'choosing'
  | 'diving'
  | 'inner'
  | 'returning'
  | 'chapterEnd'
  | 'paused'
  | 'help'
  | 'error';

/** Allowed moves of the state machine (TECH §4). `paused` and `help` are handled apart. */
const MOVES: Record<GameState, GameState[]> = {
  boot: ['start', 'error'],
  start: ['picker', 'opening', 'outer'],
  picker: ['opening'],
  opening: ['outer'],
  outer: ['choosing', 'chapterEnd'],
  choosing: ['outer', 'diving'],
  diving: ['inner'],
  inner: ['returning', 'help'],
  returning: ['outer'],
  chapterEnd: ['start'],
  paused: [],
  help: ['outer'],
  error: ['boot'],
};

export class Router {
  private current: GameState = 'boot';
  private beforePause: GameState | null = null;

  get state(): GameState {
    return this.current;
  }

  get pausedFrom(): GameState | null {
    return this.beforePause;
  }

  can(to: GameState): boolean {
    if (to === 'paused') return this.current !== 'paused' && this.current !== 'boot';
    return MOVES[this.current].includes(to);
  }

  go(to: GameState): boolean {
    if (!this.can(to)) {
      console.warn(`[router] blocked ${this.current} → ${to}`);
      return false;
    }
    const from = this.current;
    if (to === 'paused') this.beforePause = from;
    this.current = to;
    bus.emit('state:changed', { from, to });
    return true;
  }

  resume(): void {
    if (this.current !== 'paused' || !this.beforePause) return;
    const to = this.beforePause;
    this.beforePause = null;
    this.current = to;
    bus.emit('state:changed', { from: 'paused', to });
  }

  /** Test helper only. */
  force(to: GameState): void {
    const from = this.current;
    this.current = to;
    bus.emit('state:changed', { from, to });
  }
}

export const router = new Router();
