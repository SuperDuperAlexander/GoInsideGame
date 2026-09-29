import { el, fadeIn, fadeOut, uiRoot } from './dom';

/** Handwritten world text ("Breathe.", echoes, the soul question), placed on screen. */
export class WorldText {
  readonly root: HTMLElement;

  constructor(text: string, o: { inner?: boolean; top?: string; testid?: string; x?: number; y?: number } = {}) {
    this.root = el('div', { class: `lw-worldtext lw-hand${o.inner ? ' lw-inner' : ''}`, 'data-testid': o.testid ?? 'worldtext', 'aria-live': 'polite' }, [text]);
    this.root.style.top = o.top ?? '38%';
    uiRoot().append(this.root);
    fadeIn(this.root);
  }

  /** Position in screen pixels (centre). */
  place(x: number, y: number): void {
    this.root.style.left = `${x}px`;
    this.root.style.top = `${y}px`;
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
