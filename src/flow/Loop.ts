import { TUNING } from '../config/tuning';
import { audio } from '../core/audio';
import { t } from '../core/content';
import { bus } from '../core/events';
import { router } from '../core/router';
import { memory } from '../core/save';
import type { Disturbance } from '../outer/Disturbance';
import { WORLD } from '../render/materials/greyChunk';
import { WorldMood, type WorldEvent } from '../logic/worldMood';
import { el, fadeIn, uiRoot } from '../ui/dom';
import { seedList } from '../ui/SeedBook';
import type { Connection } from './Connection';
import type { Game } from './Game';

/**
 * The full loop in the outer world: what changes after a connection, the fountain, the gate,
 * the chapter end, and restoring all of it when the player continues later.
 */
export class Loop {
  private satTarget = -1;
  private ending = false;
  readonly mood = new WorldMood();
  private conn: Connection;

  constructor(
    private readonly game: Game,
    conn: Connection,
  ) {
    this.conn = conn;
    conn.onConnected = (d, theme) => this.connected(d, false, theme, conn.events);
    game.tickers.push((dt) => this.tick(dt));
  }

  get connectedCount(): number {
    return this.game.disturbances.filter((d) => d.state.isConnected).length;
  }

  /** The world has changed: zone, chest light, fountain; after 3 the gate. */
  private connected(d: Disturbance, instant: boolean, theme?: string, aiEvents: WorldEvent[] = []): void {
    const o = this.game.outer;
    const n = this.connectedCount;
    // The town changes as a whole: mood, people, events, colour, music.
    if (!instant) {
      const fresh = this.mood.connect(theme ?? d.state.theme ?? 'Something else', aiEvents);
      o.living.bloom(d.home.x, d.home.z, fresh);
      memory.data.world = this.mood.snapshot() as never;
      audio.worldGrow(this.mood.connections, this.mood.events.includes('music'));
      audio.chime(0.6, 0.12);
    }
    o.living.setMood(this.mood.mood, instant);
    o.living.garden(d.home.x + (d.collider.x - d.home.x), d.home.z + (d.collider.z - d.home.z), instant);
    o.figures.greetBoost = this.mood.events.includes('peopleGreet') ? 1 : 0;
    this.satTarget = Math.max(this.satTarget, Math.min(1, 0.08 + n * 0.25));
    // The colour flows along the whole lane of the connected disturbance.
    const lane = o.map.layout.lanes[d.index];
    for (const [px, pz] of lane.points) o.zones.add(px, pz, 5, instant);
    o.zones.seconds = memory.data.settings.reducedMotion ? TUNING.motion.zoneGrow * 1.6 : TUNING.motion.zoneGrow;
    o.zones.add(d.home.x, d.home.z, TUNING.world.zoneRadius, instant);
    const sq = o.map.layout.square;
    if (instant) o.zones.add(sq.x, sq.z, 3 + n * 3, true);
    else o.zones.grow(sq.x, sq.z, 3 + n * 3);
    o.player.lightSize = TUNING.player.chestLightStart + n * TUNING.player.chestLightStep;
    o.fountain.setConnections(n, instant);
    memory.data.chapter.connected = n;
    if (n >= 3 && !o.gate.opening) {
      o.gate.open(instant);
      memory.data.chapter.gateOpen = true;
      this.satTarget = 1;
      void this.conn;
      if (!instant) {
        audio.swell();
        bus.emit('gate:open', {});
      }
    }
    memory.save();
  }

  /** Continue: rebuild the changed world from the save. */
  restore(): void {
    this.mood.restore(memory.data.world as never);
    const o = this.game.outer;
    const done = this.game.disturbances.filter((d) => d.state.isConnected);
    for (const d of done) this.connected(d, true);
    o.living.bloom(0, 0, this.mood.events, true);
    o.living.setMood(this.mood.mood, true);
    audio.worldGrow(this.mood.connections, this.mood.events.includes('music'));
    WORLD.saturation = Math.max(WORLD.saturation, Math.min(1, 0.08 + done.length * 0.25));
    if (memory.data.chapter.gateOpen) WORLD.saturation = Math.max(WORLD.saturation, 1);
  }

  private tick(dt: number): void {
    const o = this.game.outer;
    o.fountain.update(dt);
    o.gate.update(dt);
    o.living.update(dt);
    o.figures.warmth = o.living.shown.warmth;
    if (this.satTarget > 0 && WORLD.saturation < this.satTarget) WORLD.saturation = Math.min(this.satTarget, WORLD.saturation + dt / 8);
    // Walking through the open gate ends the chapter.
    const g = o.map.layout.gate;
    if (!this.ending && o.gate.opening && router.state === 'outer' && o.walker.z > g.z + 1.2) void this.end();
  }

  async end(): Promise<void> {
    this.ending = true;
    memory.data.chapter.complete = true;
    memory.save();
    router.go('chapterEnd');
    bus.emit('chapter:end', {});
    audio.swell();
    const blend = el('div', { class: 'lw-gold lw-passthrough' });
    uiRoot().append(blend);
    blend.style.transition = 'opacity 2.5s ease-in-out';
    void blend.offsetWidth;
    blend.style.opacity = '1';
    await new Promise((r) => setTimeout(r, 2600));
    const card = el('section', { class: 'lw-screen lw-end', 'data-testid': 'chapter-end' }, [
      el('div', { class: 'lw-panel', style: 'max-width: 520px; width: 100%; text-align: center' }, [
        el('h1', { class: 'lw-title' }, [t('end.title')]),
        el('p', { class: 'lw-line' }, [t('end.line')]),
        el('h2', { style: 'font-size: 18px' }, [t('end.seeds')]),
        seedList(memory.data.seeds),
        el('p', { class: 'lw-line', style: 'margin: 18px auto 12px' }, [t('end.next')]),
        el('button', {
          class: 'lw-btn',
          'data-testid': 'end-walk',
          onclick: () => {
            card.remove();
            blend.style.opacity = '0';
            setTimeout(() => blend.remove(), 2600);
            this.game.teleport(g().x, g().z - 3, Math.PI);
            router.go('outer');
          },
        }, [t('pause.resume')]),
      ]),
    ]);
    const g = () => this.game.outer.map.layout.gate;
    uiRoot().append(card);
    fadeIn(card);
    blend.style.opacity = '0.5';
  }
}
