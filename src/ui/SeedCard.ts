import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

/** A handwritten sentence on a small paper card, editable, "Keep it". */
export class SeedCard {
  readonly root: HTMLElement;
  private area: HTMLTextAreaElement;

  constructor(text: string, onKeep: (text: string) => void) {
    this.area = el('textarea', { rows: 3, maxlength: 140, 'aria-label': t('seed.title'), 'data-testid': 'seed-text' });
    this.area.value = text;
    this.root = el('div', { class: 'lw-seed', 'data-testid': 'seed-card', role: 'dialog', 'aria-label': t('seed.title') }, [
      el('h2', {}, [t('seed.title')]),
      this.area,
      el('button', {
        class: 'lw-btn',
        'data-testid': 'seed-keep',
        onclick: () => onKeep(this.area.value.trim() || text),
      }, [t('seed.keep')]),
    ]);
    uiRoot().append(this.root);
    fadeIn(this.root);
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
