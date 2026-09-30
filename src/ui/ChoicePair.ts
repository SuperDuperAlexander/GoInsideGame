import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

/** Two quiet words above the figure: Stay outside · Go within. */
export class ChoicePair {
  readonly root: HTMLElement;

  constructor(onChoose: (c: 'outside' | 'within') => void) {
    const out = el('button', { 'data-testid': 'choice-outside', onclick: () => onChoose('outside') }, [t('choice.outside')]);
    const inn = el('button', { class: 'lw-within', 'data-testid': 'choice-within', onclick: () => onChoose('within') }, [
      t('choice.within'),
    ]);
    this.root = el('div', { class: 'lw-choice', 'data-testid': 'choice', role: 'group' }, [out, inn]);
    uiRoot().append(this.root);
    fadeIn(this.root);
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
