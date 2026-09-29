import type { GameState } from './router';

/** All events of the game and their payloads. */
export interface EventMap {
  'state:changed': { from: GameState; to: GameState };
  'breath:finished': { inSeconds: number; outSeconds: number; rhythmScore: number };
  'breath:inhaleStart': Record<string, never>;
  'input:push': Record<string, never>;
  'input:pause': Record<string, never>;
  'disturbance:near': { id: number };
  'disturbance:far': { id: number };
  'disturbance:pushed': { id: number; pushes: number };
  'disturbance:formChanged': { id: number; formIndex: number };
  'disturbance:connected': { id: number; theme: string };
  'choice:made': { id: number; choice: 'within' | 'outside' };
  'inner:step': { step: string };
  'seed:kept': { id: number; text: string };
  'gate:open': Record<string, never>;
  'chapter:end': Record<string, never>;
  'settings:changed': Record<string, never>;
  'crisis': Record<string, never>;
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void;

/** Small typed event bus. Systems talk only through this. */
export class EventBus {
  private handlers = new Map<keyof EventMap, Set<Handler<never>>>();

  on<K extends keyof EventMap>(type: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<never>);
    return () => set.delete(handler as Handler<never>);
  }

  emit<K extends keyof EventMap>(type: K, payload: EventMap[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const h of [...set]) (h as Handler<K>)(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const bus = new EventBus();
