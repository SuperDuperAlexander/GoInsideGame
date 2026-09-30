import { t } from '../core/content';
import type { SeedEntry } from '../logic/themeMemory';
import { el } from './dom';

/** Pages of paper cards with the player's seeds. Returns the content element. */
export function seedList(seeds: SeedEntry[]): HTMLElement {
  if (!seeds.length) return el('p', { 'data-testid': 'seedbook-empty' }, [t('seedBook.empty')]);
  return el(
    'div',
    { class: 'lw-seeds', 'data-testid': 'seedbook' },
    seeds.map((s) =>
      el('div', { class: 'lw-seedcard' }, [el('p', { class: 'lw-hand' }, [s.text]), el('small', {}, [t(`picker.card.${s.type}`)])]),
    ),
  );
}
