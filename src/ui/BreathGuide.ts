import { t } from '../core/content';
import { el, uiRoot } from './dom';

/**
 * The guided breath (like a breathing bubble): a soft circle at the side grows while the player
 * breathes in and shrinks while they breathe out. Nothing to press. The player simply follows it.
 */
export class BreathGuide {
  readonly root: HTMLElement;
  private bubble: HTMLElement;
  private label: HTMLElement;
  private shown = false;

  constructor() {
    this.bubble = el('div', { class: 'lw-guide-bubble' }, [el('div', { class: 'lw-guide-core' })]);
    this.label = el('div', { class: 'lw-guide-label', 'aria-live': 'polite' });
    this.root = el('div', { class: 'lw-guide lw-passthrough', 'data-testid': 'breath-guide', 'aria-hidden': 'false' }, [
      this.bubble,
      this.label,
    ]);
    uiRoot().append(this.root);
  }

  /** `phase` inhale/exhale/idle, `level` 0..1 of the guide. */
  update(visible: boolean, phase: 'inhale' | 'exhale' | 'idle', level: number, dark: boolean): void {
    if (visible !== this.shown) {
      this.shown = visible;
      this.root.classList.toggle('lw-on', visible);
    }
    if (!visible) return;
    this.root.classList.toggle('lw-dark', dark);
    const s = 0.45 + level * 0.55;
    this.bubble.style.transform = `scale(${s.toFixed(3)})`;
    const text = phase === 'inhale' ? t('guide.in') : phase === 'exhale' ? t('guide.out') : '';
    if (this.label.textContent !== text) this.label.textContent = text;
  }
}
