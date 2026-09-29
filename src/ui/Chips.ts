import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

/** Answer chips (max 6) plus "Your own words". */
export class Chips {
  readonly root: HTMLElement;

  constructor(chips: string[], onChip: (text: string, index: number) => void, onOwn: () => void) {
    const buttons = chips.slice(0, 6).map((c, i) =>
      el('button', { class: 'lw-chip', 'data-testid': `chip-${i}`, onclick: () => onChip(c, i) }, [c]),
    );
    const own = el('button', { class: 'lw-chip lw-own', 'data-testid': 'chip-own', onclick: () => onOwn() }, [t('inner.ownWords')]);
    this.root = el('div', { class: 'lw-chips', role: 'group', 'data-testid': 'chips' }, [...buttons, own]);
    uiRoot().append(this.root);
    fadeIn(this.root);
    buttons[0]?.focus();
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
