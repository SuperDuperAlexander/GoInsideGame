import type { Engine } from '@babylonjs/core/Engines/engine';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TUNING } from '../config/tuning';
import { audio } from '../core/audio';
import { content, t } from '../core/content';
import { bus } from '../core/events';
import { flags } from '../core/flags';
import { Input } from '../core/input';
import { Perf } from '../core/perf';
import { router } from '../core/router';
import { memory } from '../core/save';
import { BreathSystem } from '../logic/breath';
import { RestlessnessSystem } from '../logic/restlessness';
import { createEngine } from '../render/engine';
import { updateCardboardUniforms } from '../render/materials/cardboard';
import { WORLD } from '../render/materials/greyChunk';
import { Disturbance } from '../outer/Disturbance';
import { OuterWorld } from '../outer/OuterWorld';
import { BreathButton } from '../ui/BreathButton';
import { ChoicePair } from '../ui/ChoicePair';
import { DebugOverlay } from '../ui/DebugOverlay';
import { Hint } from '../ui/Hint';
import { Joystick } from '../ui/Joystick';
import { PushButton } from '../ui/PushButton';
import { Opening } from './Opening';

/** A breath driven by a script (tests, ?autobreathe). */
interface ScriptedBreath {
  t: number;
  inFor: number;
  resolve: () => void;
}

/** Owns the engine, the scenes and all systems. One per page. */
export class Game {
  readonly engine: Engine;
  readonly input: Input;
  readonly perf: Perf;
  readonly outer: OuterWorld;
  readonly breath = new BreathSystem();
  readonly restless = new RestlessnessSystem();
  readonly debug: DebugOverlay;
  readonly hint = new Hint();
  disturbances: Disturbance[] = [];
  private joystick: Joystick;
  private instr: SceneInstrumentation;
  private breathButton: BreathButton;
  private pushButton: PushButton;
  private opening: Opening | null = null;
  private choice: ChoicePair | null = null;
  private choiceFor: Disturbance | null = null;
  /** After coming back out, the choice waits until the player has stepped away once. */
  suppressChoice: Disturbance | null = null;
  private walkHintTime = -1;
  private scripted: ScriptedBreath | null = null;
  private samples: (() => void)[] = [];
  private checkpointTimer = 0;
  /** A breath is asked for (opening, dive, one, return): shows the breath button / hint. */
  breathAsked = false;
  /** While diving: set by the connection flow. */
  onWithin: ((d: Disturbance) => void) | null = null;
  /** Extra per-frame work of other flows. */
  readonly tickers: ((dt: number) => void)[] = [];
  time = 0;
  readonly safe = flags.safe;
  heartbeat = 0;
  awake = 1;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.input = new Input(canvas);
    this.engine = createEngine(canvas, this.input.touchMode);
    this.perf = new Perf(this.engine, this.input.touchMode);
    const layout = content().chapter;
    this.outer = new OuterWorld(this.engine, layout, { safe: flags.safe, tier: this.perf.tier });
    this.instr = new SceneInstrumentation(this.outer.scene);
    this.debug = new DebugOverlay(flags.debug);
    this.joystick = new Joystick(this.input);
    this.breathButton = new BreathButton(this.input, t('a11y.breath'));
    this.pushButton = new PushButton(t('a11y.push'));
    this.breath.setPreset(memory.data.settings.rhythm);
    if (flags.color) WORLD.saturation = 1;
    const s = layout.start;
    this.teleport(s.x, s.z, s.heading);

    this.breath.onFinished((e) => {
      bus.emit('breath:finished', e);
      this.outer.player.emitWave();
    });
    bus.on('breath:finished', () => this.onBreath());
    bus.on('input:push', () => this.tryPush());
    // Sound starts only after the first user interaction.
    const unlock = () => {
      audio.start();
      for (const d of this.disturbances) d.startSound();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    this.engine.runRenderLoop(() => this.frame());
    window.addEventListener('resize', () => this.engine.resize());
  }

  get walking(): boolean {
    return router.state === 'outer' || router.state === 'choosing';
  }

  /** Builds the three disturbances from the picks (lanes west, centre, east). */
  setupDisturbances(picks: string[]): void {
    for (const d of this.disturbances) d.root.dispose();
    this.disturbances = [];
    const lanes = content().chapter.lanes;
    picks.slice(0, 3).forEach((type, i) => {
      const d = new Disturbance(this.outer.scene, this.outer.map, type, i, lanes[i]);
      const saved = memory.data.disturbances[i];
      if (saved) d.restore(saved);
      if (audio.ctx) d.startSound();
      this.disturbances.push(d);
    });
  }

  saveDisturbances(): void {
    memory.data.disturbances = this.disturbances.map((d) => d.state.snapshot());
    memory.save();
  }

  startOpening(): void {
    this.opening = new Opening(this.canvas);
    this.awake = 0;
    this.breathAsked = true;
  }

  private onBreath(): void {
    if (router.state === 'opening' && this.opening) {
      this.opening.breathed();
      this.breathAsked = false;
    }
  }

  tryPush(): boolean {
    if (!this.walking) return false;
    const d = this.nearest(TUNING.disturb.pushRange + 0.2);
    if (!d) return false;
    d.push();
    bus.emit('disturbance:pushed', { id: d.index, pushes: d.state.pushes });
    this.saveDisturbances();
    return true;
  }

  /** Nearest unconnected disturbance within `range` (edge distance). */
  nearest(range: number): Disturbance | null {
    let best: Disturbance | null = null;
    for (const d of this.disturbances) {
      if (d.state.isConnected) continue;
      const edge = d.distance - d.collider.r;
      if (edge <= range && (!best || d.distance < best.distance)) best = d;
    }
    return best;
  }

  /** One full breath, driven by script. Resolves when it is counted. */
  breathe(): Promise<void> {
    return new Promise((resolve) => {
      this.scripted = { t: 0, inFor: TUNING.breath.autoIn, resolve };
      const off = bus.on('breath:finished', () => {
        off();
        this.scripted = null;
        resolve();
      });
    });
  }

  private breathInput(dt: number): { inhaleHeld: boolean; exhaleHeld: boolean; touchMode: boolean } {
    if (!this.scripted && flags.autobreathe && this.breathAsked) this.scripted = { t: 0, inFor: TUNING.breath.autoIn, resolve: () => undefined };
    if (this.scripted) {
      const s = this.scripted;
      s.t += dt;
      const inhale = s.t < s.inFor;
      if (!inhale && this.breath.phase === 'idle' && this.breath.level <= 0) {
        // Autobreathe: one breath per ask; the listener in breathe() clears it.
        if (!flags.autobreathe || !this.breathAsked) this.scripted = null;
        else s.t = 0;
      }
      return { inhaleHeld: inhale, exhaleHeld: !inhale, touchMode: false };
    }
    return { inhaleHeld: this.input.inhaleHeld, exhaleHeld: this.input.exhaleHeld, touchMode: this.input.touchMode };
  }

  private frame(): void {
    const dt = Math.min(0.05, this.engine.getDeltaTime() / 1000);
    this.time += dt;
    this.perf.update(dt);
    this.breath.update(dt, this.breathInput(dt));
    for (const f of this.tickers) f(dt);
    if (this.innerActive && (router.state === 'inner' || router.state === 'help' || router.state === 'paused')) {
      this.renderInner?.(dt);
    } else {
      this.frameOuter(dt);
    }
    for (const f of this.samples.splice(0)) f();
    this.updateUi();
  }

  /** Set by the inner world. */
  renderInner: ((dt: number) => void) | null = null;
  innerActive = false;

  private frameOuter(dt: number): void {
    const o = this.outer;
    const w = o.walker;
    const state = router.state;
    if (state === 'paused') {
      o.scene.render();
      return;
    }
    const input = this.walking ? this.input.move() : { x: 0, y: 0 };
    w.update(dt, input, o.camera.yaw);
    this.restless.update(dt, w.intent.x, w.intent.z);
    const r = this.restless.value;
    o.figures.update(dt, r);
    o.zones.update(dt);
    WORLD.hazeBoost += (r - WORLD.hazeBoost) * Math.min(1, dt * 2);

    if (this.opening) {
      if (this.opening.update(dt)) {
        router.go('outer');
        this.walkHintTime = 0;
        this.hint.show(t(this.input.touchMode ? 'hint.walkTouch' : 'hint.walkDesktop'), false, 'walk-hint');
      }
      this.awake = this.opening.awake;
      if (this.opening.done) this.opening = null;
    }
    if (this.walkHintTime >= 0 && state === 'outer') {
      if (w.speed > 0.5) this.walkHintTime += dt;
      if (this.walkHintTime > TUNING.hints.walkFadeAfter) {
        this.walkHintTime = -1;
        this.hint.hide();
      }
    }

    // Disturbances: pulse, forms, darkness, heartbeat, choice.
    let heart = 0;
    let dark: Disturbance | null = null;
    for (const d of this.disturbances) {
      const res = d.update(dt, w.x, w.z, r);
      if (res.formChanged) {
        bus.emit('disturbance:formChanged', { id: d.index, formIndex: d.state.formIndex });
        this.saveDisturbances();
      }
      if (!d.state.isConnected) {
        const edge = Math.max(0, d.distance - d.collider.r);
        heart = Math.max(heart, 1 - edge / TUNING.disturb.nearRange);
        if (!dark || d.distance < dark.distance) dark = d;
      }
    }
    this.heartbeat += (Math.max(0, heart) - this.heartbeat) * Math.min(1, dt * 2);
    if (dark) {
      const near = Math.max(0, 1 - (dark.distance - dark.collider.r) / 14);
      WORLD.dark.set([dark.collider.x, dark.collider.z, TUNING.disturb.darkenRadius * dark.state.growth, dark.darkness * near]);
    } else WORLD.dark[3] = 0;
    this.updateChoice();

    // Player figure.
    o.player.root.position.set(w.x, w.y, w.z);
    o.player.update(dt, {
      speedRatio: Math.min(1, w.speed / TUNING.player.walkSpeed),
      heading: w.heading,
      breath: this.breath.level,
      awake: this.awake,
    });

    const look = this.input.takeLook();
    const since = performance.now() / 1000 - this.input.lastLookTime;
    const chest = o.player.chest.getAbsolutePosition();
    o.camera.update(dt, w.x, w.y, w.z, w.heading, look, this.input.dragging, since, chest);

    WORLD.time = this.time;
    WORLD.camPos.copyFrom(o.camera.camera.position);
    updateCardboardUniforms();
    audio.update(
      dt,
      { x: o.camera.camera.position.x, y: o.camera.camera.position.y, z: o.camera.camera.position.z, yaw: o.camera.yaw },
      r,
      this.heartbeat,
      this.breath.level,
      this.breath.phase,
      0,
    );

    this.checkpointTimer += dt;
    if (this.checkpointTimer > 5 && state === 'outer') {
      this.checkpointTimer = 0;
      memory.data.checkpoint = { x: Math.round(w.x * 2) / 2, z: Math.round(w.z * 2) / 2, heading: w.heading };
      memory.save();
    }
    o.scene.render();
  }

  private updateChoice(): void {
    const state = router.state;
    const d = this.walking ? this.nearest(TUNING.disturb.choiceRange) : null;
    if (this.suppressChoice && this.suppressChoice.distance > TUNING.disturb.nearRange + 1) this.suppressChoice = null;
    const eligible = d && d !== this.suppressChoice && !d.state.snapshot().stayedOutside ? d : null;
    if (eligible && !this.choice && state === 'outer') {
      this.choiceFor = eligible;
      eligible.state.startChoosing();
      router.go('choosing');
      this.choice = new ChoicePair((c) => this.choose(c));
    } else if (!eligible && this.choice && state === 'choosing') {
      void this.choice.close();
      this.choice = null;
      this.choiceFor = null;
      router.go('outer');
    }
  }

  /** Stay outside or go within. */
  choose(c: 'outside' | 'within'): boolean {
    const d = this.choiceFor;
    if (!d || router.state !== 'choosing') return false;
    void this.choice?.close();
    this.choice = null;
    this.choiceFor = null;
    bus.emit('choice:made', { id: d.index, choice: c });
    if (c === 'outside') {
      d.state.stayOutside();
      this.saveDisturbances();
      router.go('outer');
      return true;
    }
    this.onWithin?.(d);
    return true;
  }

  private updateUi(): void {
    const state = router.state;
    const touch = this.input.touchMode;
    const showBreath = touch && (this.breathAsked || state === 'outer' || state === 'choosing');
    this.breathButton.show(showBreath, this.breathAsked);
    this.breathButton.update(this.breath);
    if (!touch) {
      if (this.breathAsked) this.hint.show(t('hint.breathDesktop'), this.innerActive, 'breath-hint');
      else if (this.hint.visible && this.walkHintTime < 0) this.hint.hide();
    } else if (this.breathAsked && state === 'opening') {
      this.hint.show(t('hint.breathTouch'), false, 'breath-hint');
    } else if (!this.breathAsked && this.walkHintTime < 0 && this.hint.visible) this.hint.hide();
    const canPush = this.walking && !!this.nearest(TUNING.disturb.pushRange);
    this.pushButton.show(touch && canPush);
    this.joystick.update();
    this.debug.update(this.stats());
  }

  stats(): Record<string, string | number> {
    const o = this.outer;
    return {
      fps: Math.round(this.engine.getFps()),
      drawCalls: this.instr.drawCallsCounter.current,
      activeMeshes: (this.innerActive ? this.innerMeshes?.() : o.scene.getActiveMeshes().length) ?? 0,
      restlessness: this.restless.value,
      state: router.state,
      tier: this.perf.tier,
      scale: this.perf.scale,
      x: o.walker.x,
      z: o.walker.z,
      breath: this.breath.level,
      AI: this.aiMode(),
    };
  }

  innerMeshes: (() => number) | null = null;
  aiMode: () => string = () => (flags.noai ? 'off' : 'fallback');

  /** Mean greyscale brightness of a screen region (0..1), read right after rendering. */
  sample(fx = 0.5, fy = 0.5, size = 0.2): Promise<number> {
    return new Promise((resolve) => this.samples.push(() => void this.readSample(fx, fy, size).then(resolve)));
  }

  private async readSample(fx: number, fy: number, size: number): Promise<number> {
    const e = this.engine;
    const w = e.getRenderWidth();
    const h = e.getRenderHeight();
    const sw = Math.max(1, Math.floor(w * size));
    const sh = Math.max(1, Math.floor(h * size));
    const px = (await e.readPixels(Math.floor(w * fx - sw / 2), Math.floor(h * (1 - fy) - sh / 2), sw, sh)) as Uint8Array;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    return sum / (px.length / 4) / 255;
  }

  teleport(x: number, z: number, h = 0): void {
    this.outer.walker.place(x, z, h);
    this.outer.camera.snap(x, this.outer.walker.y, z, h);
  }

  chestPosition(): Vector3 {
    return this.outer.player.chest.getAbsolutePosition();
  }
}
