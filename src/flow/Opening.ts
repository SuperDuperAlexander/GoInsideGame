import { t } from '../core/content';
import { el, fadeIn, uiRoot } from '../ui/dom';
import { WorldText } from '../ui/WorldText';

/**
 * Awakening: the player lies in the grey field, the screen is blurred and grey.
 * One handwritten word floats: "Breathe." The first full breath clears it.
 */
export class Opening {
  private blur: HTMLElement;
  private word: WorldText;
  awake = 0;
  done = false;
  private rising = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.blur = el('div', { class: 'lw-blur lw-passthrough', 'data-testid': 'opening-blur' });
    uiRoot().append(this.blur);
    fadeIn(this.blur);
    // The canvas itself is blurred and grey (backdrop filters are not reliable over WebGL).
    this.canvas.style.transition = 'filter 1.6s ease-out';
    this.canvas.style.filter = 'blur(9px) grayscale(1)';
    this.word = new WorldText(t('opening.breathe'), { top: '34%', testid: 'opening-word' });
  }

  /** The first full breath. */
  breathed(): void {
    if (this.rising) return;
    this.rising = true;
    this.blur.style.opacity = '0';
    this.canvas.style.filter = 'blur(0px) grayscale(0)';
    setTimeout(() => (this.canvas.style.filter = ''), 1700);
    void this.word.close();
    setTimeout(() => this.blur.remove(), 1700);
  }

  /** Returns true once the player stands. */
  update(dt: number): boolean {
    if (this.rising && this.awake < 1) this.awake = Math.min(1, this.awake + dt / 1.5);
    if (this.awake >= 1 && !this.done) {
      this.done = true;
      return true;
    }
    return false;
  }
}
