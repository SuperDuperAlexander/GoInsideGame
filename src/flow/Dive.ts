import { el, uiRoot } from '../ui/dom';

/** The warm gold fade between the two worlds. */
export class GoldFade {
  private root: HTMLElement;

  constructor() {
    this.root = el('div', { class: 'lw-gold lw-passthrough', 'data-testid': 'gold' });
    uiRoot().append(this.root);
  }

  /** Fade to gold over `ms`, then resolve. */
  in(ms: number): Promise<void> {
    this.root.style.transition = `opacity ${ms}ms ease-in-out`;
    void this.root.offsetWidth;
    this.root.style.opacity = '1';
    return new Promise((r) => setTimeout(r, ms));
  }

  out(ms: number): Promise<void> {
    this.root.style.transition = `opacity ${ms}ms ease-in-out`;
    void this.root.offsetWidth;
    this.root.style.opacity = '0';
    return new Promise((r) => setTimeout(r, ms));
  }

  get level(): number {
    return Number(this.root.style.opacity || 0);
  }
}
