import type { Engine } from '@babylonjs/core/Engines/engine';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { content } from '../core/content';
import { flags } from '../core/flags';
import { Input } from '../core/input';
import { Perf } from '../core/perf';
import { router } from '../core/router';
import { RestlessnessSystem } from '../logic/restlessness';
import { BreathSystem } from '../logic/breath';
import { createEngine } from '../render/engine';
import { updateCardboardUniforms } from '../render/materials/cardboard';
import { WORLD } from '../render/materials/greyChunk';
import { OuterWorld } from '../outer/OuterWorld';
import { DebugOverlay } from '../ui/DebugOverlay';
import { Joystick } from '../ui/Joystick';

/** Owns the engine, the scenes and all systems. One per page. */
export class Game {
  readonly engine: Engine;
  readonly input: Input;
  readonly perf: Perf;
  readonly outer: OuterWorld;
  readonly breath = new BreathSystem();
  readonly restless = new RestlessnessSystem();
  readonly debug: DebugOverlay;
  private joystick: Joystick;
  private instr: SceneInstrumentation;
  time = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.input = new Input(canvas);
    this.engine = createEngine(canvas, this.input.touchMode);
    this.perf = new Perf(this.engine, this.input.touchMode);
    const layout = content().chapter;
    this.outer = new OuterWorld(this.engine, layout, { safe: flags.safe });
    this.instr = new SceneInstrumentation(this.outer.scene);
    this.instr.captureFrameTime = false;
    this.debug = new DebugOverlay(flags.debug);
    this.joystick = new Joystick(this.input);
    if (flags.color) WORLD.saturation = 1;
    const s = layout.start;
    this.outer.walker.place(s.x, s.z, s.heading);
    this.outer.camera.snap(s.x, this.outer.walker.y, s.z, s.heading);
    this.engine.runRenderLoop(() => this.frame());
    window.addEventListener('resize', () => this.engine.resize());
  }

  get walking(): boolean {
    return router.state === 'outer';
  }

  private frame(): void {
    const dt = Math.min(0.05, this.engine.getDeltaTime() / 1000);
    this.time += dt;
    this.perf.update(dt);
    const o = this.outer;
    const input = this.walking ? this.input.move() : { x: 0, y: 0 };
    o.walker.update(dt, input, o.camera.yaw);
    this.restless.update(dt, o.walker.intent.x, o.walker.intent.z);
    this.breath.update(dt, {
      inhaleHeld: this.input.inhaleHeld,
      exhaleHeld: this.input.exhaleHeld,
      touchMode: this.input.touchMode,
    });
    const w = o.walker;
    o.player.root.position.set(w.x, w.y, w.z);
    o.player.update(dt, {
      speedRatio: Math.min(1, w.speed / 4.2),
      heading: w.heading,
      breath: this.breath.level,
      awake: 1,
    });
    const look = this.input.takeLook();
    const since = performance.now() / 1000 - this.input.lastLookTime;
    o.camera.update(dt, w.x, w.y, w.z, w.heading, look, this.input.dragging, since);
    WORLD.time = this.time;
    WORLD.camPos.copyFrom(o.camera.camera.position);
    updateCardboardUniforms();
    this.joystick.update();
    o.scene.render();
    this.debug.update(this.stats());
  }

  stats(): Record<string, string | number> {
    const o = this.outer;
    return {
      fps: Math.round(this.engine.getFps()),
      drawCalls: this.instr.drawCallsCounter.current,
      activeMeshes: o.scene.getActiveMeshes().length,
      restlessness: this.restless.value,
      state: router.state,
      tier: this.perf.tier,
      scale: this.perf.scale,
      x: o.walker.x,
      z: o.walker.z,
      AI: flags.noai ? 'off' : 'fallback',
    };
  }

  teleport(x: number, z: number, h = 0): void {
    this.outer.walker.place(x, z, h);
    this.outer.camera.snap(x, this.outer.walker.y, z, h);
  }
}
