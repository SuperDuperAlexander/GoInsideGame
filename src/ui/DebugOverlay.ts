import { el, uiRoot } from './dom';

/** fps, draw calls, active meshes, restlessness, state, AI mode. `?debug` or F3. */
export class DebugOverlay {
  private root: HTMLElement;
  visible: boolean;

  constructor(visible: boolean) {
    this.visible = visible;
    this.root = el('div', { class: 'lw-debug', 'data-testid': 'debug' });
    if (!visible) this.root.classList.add('lw-hidden');
    uiRoot().append(this.root);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.visible = !this.visible;
        this.root.classList.toggle('lw-hidden', !this.visible);
      }
    });
  }

  update(lines: Record<string, string | number>): void {
    if (!this.visible) return;
    this.root.textContent = Object.entries(lines)
      .map(([k, v]) => `${k}: ${typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v}`)
      .join('\n');
  }
}
