import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { TUNING } from '../config/tuning';
import { memory } from '../core/save';
import { echoDisplay } from '../logic/themeMemory';
import { WorldText } from '../ui/WorldText';
import type { Disturbance } from './Disturbance';

/**
 * Your words echo: an unconnected, waiting disturbance shows one fragment of the player's own free text
 * as handwriting when the player passes within 6 m. At most one echo every 20 s. Nothing before any words.
 */
export class Echo {
  private cooldown = 0;
  private current: { text: WorldText; d: Disturbance; t: number } | null = null;
  private next = 0;
  shown: string[] = [];

  constructor(private readonly scene: Scene) {}

  update(dt: number, list: Disturbance[], active: boolean): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.current) {
      this.current.t += dt;
      this.place(this.current.text, this.current.d);
      if (this.current.t > TUNING.echo.showSeconds || !active) {
        void this.current.text.close();
        this.current = null;
      }
      return;
    }
    if (!active || this.cooldown > 0) return;
    const frags = memory.data.fragments;
    if (!frags.length) return;
    const d = list.find((x) => !x.state.isConnected && x.state.phase !== 'within' && x.distance - x.collider.r < TUNING.echo.showRange);
    if (!d) return;
    const frag = frags[this.next % frags.length];
    this.next++;
    const text = new WorldText(echoDisplay(frag), { testid: 'echo' });
    this.place(text, d);
    this.current = { text, d, t: 0 };
    this.shown.push(frag);
    this.cooldown = TUNING.echo.cooldown;
  }

  private place(text: WorldText, d: Disturbance): void {
    const cam = this.scene.activeCamera;
    if (!cam) return;
    const engine = this.scene.getEngine();
    const w = engine.getRenderWidth();
    const h = engine.getRenderHeight();
    const p = new Vector3(d.collider.x, d.root.position.y + d.height * d.root.scaling.y + 0.6, d.collider.z);
    const s = Vector3.Project(p, Matrix.IdentityReadOnly, this.scene.getTransformMatrix(), cam.viewport.toGlobal(w, h));
    const scale = window.innerWidth / w;
    text.place(Math.max(80, Math.min(window.innerWidth - 80, s.x * scale)), Math.max(60, Math.min(window.innerHeight * 0.6, s.y * (window.innerHeight / h))));
    text.root.style.opacity = s.z > 0 && s.z < 1 ? '' : '0';
  }
}
