import { bus } from '../core/events';
import { el, uiRoot } from './dom';

/** Touch: a hand button, only within push range. */
export class PushButton {
  readonly root: HTMLButtonElement;

  constructor(label: string) {
    this.root = el('button', { class: 'lw-push lw-hidden', 'aria-label': label, 'data-testid': 'push-button' });
    this.root.innerHTML =
      '<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true"><path d="M16 26V12a3 3 0 0 1 6 0v10M22 22V9a3 3 0 0 1 6 0v13M28 22v-9a3 3 0 0 1 6 0v15c0 8-5 13-11 13-5 0-8-3-10-7l-4-8a3 3 0 0 1 5-3l4 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    this.root.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      bus.emit('input:push', {});
    });
    this.root.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') bus.emit('input:push', {});
    });
    uiRoot().append(this.root);
  }

  show(v: boolean): void {
    this.root.classList.toggle('lw-hidden', !v);
  }
}
