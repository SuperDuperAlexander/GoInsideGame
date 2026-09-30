import { TUNING } from '../config/tuning';
import { audio } from '../core/audio';
import { t } from '../core/content';
import { bus } from '../core/events';
import { router } from '../core/router';
import { memory } from '../core/save';
import type { Disturbance } from '../outer/Disturbance';
import { InnerWorld } from '../inner/InnerWorld';
import { updatePaperUniforms } from '../render/materials/papercut';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { WorldText } from '../ui/WorldText';
import type { Game } from './Game';
import { GoldFade } from './Dive';

export type InnerStep = 'dive' | 'arrive' | 'soul' | 'answer' | 'answer2' | 'heart' | 'one' | 'seed' | 'return' | 'flyout';

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Orchestrates one Connection Loop: dive → soul → answer → heart → one → seed → return. */
export class Connection {
  step: InnerStep | null = null;
  d: Disturbance | null = null;
  readonly inner: InnerWorld;
  private gold = new GoldFade();
  private dive = 0;
  private flyT = 0;
  private prompt: WorldText | null = null;
  private busy = false;
  /** True when the journey reached the end (seed kept): the disturbance connects on return. */
  complete = false;
  theme = 'Something else';

  constructor(private readonly game: Game) {
    this.inner = new InnerWorld(game.engine, { safe: game.safe });
    game.onWithin = (d) => this.begin(d);
    game.innerMeshes = () => this.inner.scene.getActiveMeshes().length;
    const instr = new SceneInstrumentation(this.inner.scene);
    game.innerDrawCalls = () => instr.drawCallsCounter.current;
    game.renderInner = (dt) => this.frameInner(dt);
    game.tickers.push((dt) => this.tick(dt));
    bus.on('breath:finished', () => this.onBreath());
  }

  get reducedMotion(): boolean {
    return memory.data.settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private begin(d: Disturbance): void {
    this.d = d;
    this.complete = false;
    d.state.goWithin();
    router.go('diving');
    this.step = 'dive';
    this.dive = 0;
    this.game.breathAsked = true;
  }

  private tick(dt: number): void {
    const cam = this.game.outer.camera;
    if (this.step === 'dive') {
      const b = this.game.breath;
      if (!this.reducedMotion && b.phase === 'inhale') this.dive = Math.max(this.dive, Math.min(1, b.level * 1.05));
      cam.dive += (this.dive - cam.dive) * Math.min(1, dt * 4);
    } else if (this.step === 'flyout') {
      this.flyT = Math.min(1, this.flyT + dt / TUNING.motion.returnSeconds);
      cam.dive = this.reducedMotion ? 0 : 1 - easeOutCubic(this.flyT);
      if (this.flyT >= 1) this.finishReturn();
    }
  }

  private onBreath(): void {
    if (this.busy) return;
    if (this.step === 'dive') void this.enter();
    else if (this.step === 'return') void this.leave();
    else this.onInnerBreath?.();
  }

  /** Set by the inner journey (the "One" step counts breaths). */
  onInnerBreath: (() => void) | null = null;

  private async enter(): Promise<void> {
    this.busy = true;
    this.game.breathAsked = false;
    await this.gold.in(TUNING.motion.goldFade * 1000);
    this.inner.clear();
    this.buildArrival();
    this.game.innerActive = true;
    this.game.input.lookAnywhere = true;
    router.go('inner');
    this.step = 'arrive';
    await this.gold.out(TUNING.motion.goldFade * 1000);
    this.busy = false;
    this.arrived();
  }

  /** Hook for the journey (M5). By default the journey is empty and only the return is offered. */
  buildArrival: () => void = () => undefined;
  arrived: () => void = () => this.askReturn();

  askReturn(): void {
    this.step = 'return';
    this.prompt = new WorldText(t('return.prompt'), { inner: true, top: '30%', testid: 'return-prompt' });
    this.game.breathAsked = true;
    bus.emit('inner:step', { step: 'return' });
  }

  private async leave(): Promise<void> {
    this.busy = true;
    this.game.breathAsked = false;
    void this.prompt?.close();
    this.prompt = null;
    this.cleanup?.();
    await this.gold.in(TUNING.motion.goldFade * 1000);
    this.game.innerActive = false;
    this.game.input.lookAnywhere = false;
    router.go('returning');
    this.step = 'flyout';
    this.flyT = 0;
    this.game.outer.camera.dive = this.reducedMotion ? 0 : 1;
    await this.gold.out(TUNING.motion.goldFade * 1000);
    this.busy = false;
  }

  private finishReturn(): void {
    const d = this.d;
    this.step = null;
    this.game.outer.camera.dive = 0;
    if (d) {
      if (this.complete) {
        d.state.connect(this.theme);
        bus.emit('disturbance:connected', { id: d.index, theme: this.theme });
        this.onConnected?.(d, this.theme);
      }
      else d.state.abort();
      this.game.suppressChoice = d;
      this.game.saveDisturbances();
    }
    this.d = null;
    router.go('outer');
    audio.chime(0.75, 0.1);
  }

  /** Set by the loop flow (M6): the world changes after a connection. */
  onConnected: ((d: Disturbance, theme: string) => void) | null = null;

  /** Crisis: leave at once, nothing sent, nothing stored. The disturbance stays unconnected. */
  toHelp(onReturnDone: () => void): void {
    this.cleanup?.();
    void this.prompt?.close();
    this.prompt = null;
    this.game.breathAsked = false;
    router.go('help');
    this.step = null;
    return onReturnDone();
  }

  /** After the help panel's Return: straight back to the outer world. */
  backFromHelp(): void {
    this.game.innerActive = false;
    this.game.input.lookAnywhere = false;
    this.game.outer.camera.dive = 0;
    const d = this.d;
    if (d) {
      d.state.abort();
      this.game.suppressChoice = d;
      this.game.saveDisturbances();
    }
    this.d = null;
    router.go('outer');
  }

  /** Debug and tests: jump to the return step from anywhere inside. */
  returnNow(): void {
    if (router.state !== 'inner') return;
    this.cleanup?.();
    if (this.step !== 'return') this.askReturn();
  }

  cleanup: (() => void) | null = null;

  private frameInner(dt: number): void {
    const look = this.game.input.takeLook();
    this.inner.look(look.x, look.y);
    this.inner.update(dt, this.reducedMotion);
    this.innerFrame?.(dt);
    updatePaperUniforms(this.inner.camera.position);
    audio.update(dt, { x: 0, y: 0, z: 0, yaw: 0 }, 0, 0, this.game.breath.level, this.game.breath.phase, 1);
    this.inner.render();
  }

  innerFrame: ((dt: number) => void) | null = null;
}
