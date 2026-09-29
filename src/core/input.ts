import { flags } from './flags';
import { bus } from './events';

/**
 * Keyboard, mouse and touch. No gamepad.
 * Touch: left half = joystick under the thumb, right half = look. Mouse: drag to look.
 */
export class Input {
  readonly keys = new Set<string>();
  /** Movement from the joystick, -1..1 (x = right, y = forward). */
  joy = { x: 0, y: 0 };
  /** Accumulated look drag in pixels since the last read. */
  private look = { x: 0, y: 0 };
  lastLookTime = -1e9;
  /** Held by the breath button (touch) or Space. */
  breathButton = false;
  touchMode: boolean;
  /** Where the joystick sits, for the UI. */
  joyOrigin: { x: number; y: number } | null = null;
  joyKnob = { x: 0, y: 0 };
  /** Inner world: look anywhere. */
  lookAnywhere = false;
  enabled = true;
  private joyId: number | null = null;
  private lookId: number | null = null;
  private lastPt = new Map<number, { x: number; y: number }>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.touchMode =
      flags.touch ||
      (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) ||
      navigator.maxTouchPoints > 0;

    window.addEventListener('keydown', (e) => {
      if (isTyping(e.target)) return;
      const k = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
      if (!this.keys.has(k)) {
        if (k === 'KeyE') bus.emit('input:push', {});
        if (k === 'Escape') bus.emit('input:pause', {});
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.release();
    });

    canvas.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.moveEv(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => this.up(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private release(): void {
    this.joyId = null;
    this.lookId = null;
    this.joy.x = this.joy.y = 0;
    this.joyOrigin = null;
    this.lastPt.clear();
  }

  private down(e: PointerEvent): void {
    if (!this.enabled) return;
    const touch = e.pointerType === 'touch' || this.touchMode;
    const left = e.clientX < window.innerWidth / 2;
    if (touch && left && !this.lookAnywhere && this.joyId === null) {
      this.joyId = e.pointerId;
      this.joyOrigin = { x: e.clientX, y: e.clientY };
      this.joyKnob = { x: 0, y: 0 };
    } else if (this.lookId === null) {
      this.lookId = e.pointerId;
      this.lastPt.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers cannot be captured.
    }
  }

  private moveEv(e: PointerEvent): void {
    if (e.pointerId === this.joyId && this.joyOrigin) {
      const R = 50;
      let dx = e.clientX - this.joyOrigin.x;
      let dy = e.clientY - this.joyOrigin.y;
      const l = Math.hypot(dx, dy);
      if (l > R) {
        dx = (dx / l) * R;
        dy = (dy / l) * R;
      }
      this.joyKnob = { x: dx, y: dy };
      this.joy.x = dx / R;
      this.joy.y = -dy / R;
    } else if (e.pointerId === this.lookId) {
      const p = this.lastPt.get(e.pointerId);
      if (p) {
        this.look.x += e.clientX - p.x;
        this.look.y += e.clientY - p.y;
        this.lastLookTime = performance.now() / 1000;
      }
      this.lastPt.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  }

  private up(e: PointerEvent): void {
    if (e.pointerId === this.joyId) {
      this.joyId = null;
      this.joy.x = this.joy.y = 0;
      this.joyOrigin = null;
    }
    if (e.pointerId === this.lookId) this.lookId = null;
    this.lastPt.delete(e.pointerId);
  }

  get dragging(): boolean {
    return this.lookId !== null;
  }

  takeLook(): { x: number; y: number } {
    const l = { ...this.look };
    this.look.x = this.look.y = 0;
    return l;
  }

  /** Walk input as (x = right, y = forward), length ≤ 1. */
  move(): { x: number; y: number } {
    if (!this.enabled) return { x: 0, y: 0 };
    const k = this.keys;
    let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    x += this.joy.x;
    y += this.joy.y;
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    return { x, y };
  }

  get inhaleHeld(): boolean {
    return this.keys.has('Space') || this.breathButton;
  }

  get exhaleHeld(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }
}

function isTyping(t: EventTarget | null): boolean {
  return t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement || t instanceof HTMLSelectElement;
}
