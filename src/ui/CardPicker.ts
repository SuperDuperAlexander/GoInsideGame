import { t } from '../core/content';
import { CARD_ICONS } from './icons';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

const SVGNS = 'http://www.w3.org/2000/svg';

function icon(type: string): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVGNS, 'path');
  p.setAttribute('d', CARD_ICONS[type] ?? '');
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', `var(--d-${type})`);
  p.setAttribute('stroke-width', '2.6');
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  svg.append(p);
  return svg;
}

/** 8 cards, pick exactly 3, in order. Continue appears at 3. */
export class CardPicker {
  readonly root: HTMLElement;
  private picks: string[] = [];
  private cards = new Map<string, HTMLButtonElement>();
  private cont: HTMLButtonElement;

  constructor(types: string[], onDone: (picks: string[]) => void) {
    const grid = el('div', { class: 'lw-cards', role: 'group', 'aria-label': t('picker.sub') });
    for (const type of types) {
      const order = el('span', { class: 'lw-order', 'aria-hidden': 'true' });
      const b = el(
        'button',
        { class: 'lw-card', 'aria-pressed': 'false', 'data-type': type, 'data-testid': `card-${type}`, onclick: () => this.toggle(type) },
        [icon(type), el('span', {}, [t(`picker.card.${type}`)]), order],
      );
      b.style.setProperty('--card-colour', `var(--d-${type})`);
      this.cards.set(type, b);
      grid.append(b);
    }
    this.cont = el('button', { class: 'lw-btn lw-hidden', 'data-testid': 'picker-continue', onclick: () => onDone([...this.picks]) }, [
      t('picker.continue'),
    ]);
    this.root = el('section', { class: 'lw-screen lw-picker', 'data-testid': 'picker' }, [
      el('div', { class: 'lw-panel' }, [
        el('h1', { class: 'lw-title', style: 'font-size: 26px' }, [t('picker.title')]),
        el('p', { class: 'lw-line', style: 'margin-bottom: 0' }, [t('picker.sub')]),
        grid,
        this.cont,
      ]),
    ]);
    uiRoot().append(this.root);
    fadeIn(this.root);
    this.cards.get(types[0])?.focus();
  }

  private toggle(type: string): void {
    const i = this.picks.indexOf(type);
    if (i >= 0) this.picks.splice(i, 1);
    else if (this.picks.length < 3) this.picks.push(type);
    for (const [k, b] of this.cards) {
      const n = this.picks.indexOf(k);
      b.setAttribute('aria-pressed', n >= 0 ? 'true' : 'false');
      (b.querySelector('.lw-order') as HTMLElement).textContent = n >= 0 ? `${n + 1}` : '';
    }
    this.cont.classList.toggle('lw-hidden', this.picks.length !== 3);
  }

  pick(types: string[]): void {
    for (const ty of types) this.toggle(ty);
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
