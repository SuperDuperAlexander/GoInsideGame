import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

const SVGNS = 'http://www.w3.org/2000/svg';

export const BODY_ZONES = ['head', 'throat', 'chest', 'belly', 'hands', 'legs', 'everywhere', 'unsure'] as const;
export type BodyZone = (typeof BODY_ZONES)[number];

/** Where each zone sits on the outline (viewBox 0 0 120 260). */
const SPOT: Record<string, [number, number, number]> = {
  head: [60, 28, 18],
  throat: [60, 58, 9],
  chest: [60, 88, 16],
  belly: [60, 128, 16],
  hands: [16, 150, 11],
  legs: [60, 205, 20],
  everywhere: [60, 120, 70],
  unsure: [60, 120, 0],
};

const OUTLINE =
  'M60 8c11 0 19 9 19 20s-8 21-19 21-19-10-19-21 8-20 19-20zM52 50h16v10c13 3 24 9 27 20l8 52c1 6-6 8-8 3l-9-40-2 40 6 90c0 6-10 7-11 1l-10-78h-2l-10 78c-1 6-11 5-11-1l6-90-2-40-9 40c-2 5-9 3-8-3l8-52c3-11 14-17 27-20z';

/** The heart step: a standing outline in thin gold lines with 8 tap zones. */
export class BodyOutline {
  readonly root: HTMLElement;
  private svg: SVGSVGElement;
  private glow: SVGCircleElement;

  constructor(onZone: (z: BodyZone) => void) {
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 120 260');
    this.svg.setAttribute('role', 'img');
    this.svg.setAttribute('aria-label', t('a11y.body'));
    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', OUTLINE);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--inner-gold)');
    path.setAttribute('stroke-width', '1.4');
    this.svg.append(path);
    this.glow = document.createElementNS(SVGNS, 'circle');
    this.glow.setAttribute('fill', 'var(--player-heart)');
    this.glow.setAttribute('opacity', '0');
    this.glow.style.filter = 'blur(6px)';
    this.svg.append(this.glow);
    for (const z of BODY_ZONES) {
      if (z === 'everywhere' || z === 'unsure') continue;
      const [x, y, r] = SPOT[z];
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'lw-zone');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', t(`heart.zone.${z}`));
      g.setAttribute('data-testid', `zone-${z}`);
      const hit = document.createElementNS(SVGNS, 'circle');
      hit.setAttribute('cx', String(x));
      hit.setAttribute('cy', String(y));
      hit.setAttribute('r', String(Math.max(r, 12)));
      hit.setAttribute('fill', 'rgba(240,196,106,0.06)');
      hit.setAttribute('stroke', 'var(--inner-gold)');
      hit.setAttribute('stroke-width', '0.6');
      hit.setAttribute('stroke-dasharray', '2 3');
      g.append(hit);
      if (z === 'hands') {
        const h2 = hit.cloneNode() as SVGCircleElement;
        h2.setAttribute('cx', String(120 - x));
        g.append(h2);
      }
      const pick = () => onZone(z);
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') pick();
      });
      this.svg.append(g);
    }
    const row = el('div', { class: 'lw-zone-row' }, [
      el('button', { class: 'lw-chip', 'data-testid': 'zone-everywhere', onclick: () => onZone('everywhere') }, [t('heart.zone.everywhere')]),
      el('button', { class: 'lw-chip', 'data-testid': 'zone-unsure', onclick: () => onZone('unsure') }, [t('heart.zone.unsure')]),
    ]);
    this.root = el('div', { class: 'lw-body', 'data-testid': 'body-outline' }, [
      el('p', { class: 'lw-hand lw-worldtext lw-inner', style: 'position: static; transform: none' }, [t('heart.open')]),
      this.svg as never,
      row,
    ]);
    uiRoot().append(this.root);
    fadeIn(this.root);
  }

  /** A warm light appears on the tapped spot and stays. */
  mark(z: BodyZone): void {
    const [x, y, r] = SPOT[z];
    this.glow.setAttribute('cx', String(x));
    this.glow.setAttribute('cy', String(y));
    this.glow.setAttribute('r', String(Math.max(6, r)));
    this.glow.setAttribute('opacity', z === 'unsure' ? '0' : '0.9');
    for (const g of this.svg.querySelectorAll('.lw-zone')) g.remove();
    this.root.querySelector('.lw-zone-row')?.remove();
    this.root.querySelector('p')?.remove();
    // Shrink to a small keepsake in the corner for the rest of the scene.
    this.root.classList.add('lw-passthrough');
    Object.assign(this.root.style, { inset: 'auto auto 18px 12px', width: '64px', height: '140px', padding: '0' });
    this.svg.style.height = '130px';
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
