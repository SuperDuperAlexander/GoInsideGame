import type { Input } from '../core/input';
import { el, uiRoot } from './dom';

/** The joystick appears under the thumb on the left half (touch). */
export class Joystick {
  private root: HTMLElement;
  private knob: HTMLElement;

  constructor(private readonly input: Input) {
    this.knob = el('i');
    this.root = el('div', { class: 'lw-joy lw-passthrough lw-hidden', 'data-testid': 'joystick' }, [this.knob]);
    uiRoot().append(this.root);
  }

  update(): void {
    const o = this.input.joyOrigin;
    if (!o) {
      this.root.classList.add('lw-hidden');
      return;
    }
    this.root.classList.remove('lw-hidden');
    this.root.style.left = `${o.x}px`;
    this.root.style.top = `${o.y}px`;
    this.knob.style.transform = `translate(${this.input.joyKnob.x}px, ${this.input.joyKnob.y}px)`;
  }
}
