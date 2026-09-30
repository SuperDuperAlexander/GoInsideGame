import type { Input } from '../core/input';
import type { BreathSystem } from '../logic/breath';
import { el, uiRoot } from './dom';

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * Touch: an 84 px round light button, bottom right. Fills while breathing in, empties while breathing out.
 * A thin ring shows the rhythm guide. Hold to breathe in; let go and the out-breath runs by itself.
 */
export class BreathButton {
  readonly root: HTMLButtonElement;
  private fill: SVGCircleElement;
  private guide: SVGCircleElement;
  private core: SVGCircleElement;

  constructor(private readonly input: Input, label: string) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    const mk = (r: number, attrs: Record<string, string>) => {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', '50');
      c.setAttribute('cy', '50');
      c.setAttribute('r', String(r));
      for (const [k, v] of Object.entries(attrs)) c.setAttribute(k, v);
      svg.append(c);
      return c;
    };
    mk(46, { fill: 'rgba(20,21,38,0.35)', stroke: 'var(--player-heart)', 'stroke-width': '3' });
    this.core = mk(20, { fill: 'var(--player-heartCore)' });
    this.fill = mk(20, { fill: 'var(--player-heart)', opacity: '0.85' });
    this.guide = mk(49, {
      fill: 'none',
      stroke: 'var(--player-heartCore)',
      'stroke-width': '1.5',
      'stroke-dasharray': '308',
      'stroke-dashoffset': '308',
      transform: 'rotate(-90 50 50)',
      opacity: '0.7',
    });
    this.root = el('button', { class: 'lw-breath lw-hidden', 'aria-label': label, 'data-testid': 'breath-button' }, [svg as never]);
    const down = (e: Event) => {
      e.preventDefault();
      this.input.breathButton = true;
    };
    const up = () => {
      this.input.breathButton = false;
    };
    this.root.addEventListener('pointerdown', down);
    this.root.addEventListener('pointerup', up);
    this.root.addEventListener('pointercancel', up);
    this.root.addEventListener('pointerleave', up);
    this.root.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') down(e);
    });
    this.root.addEventListener('keyup', up);
    uiRoot().append(this.root);
  }

  show(v: boolean, pulse = false): void {
    this.root.classList.toggle('lw-hidden', !v);
    this.root.classList.toggle('lw-pulse', v && pulse);
  }

  update(b: BreathSystem): void {
    if (this.root.classList.contains('lw-hidden')) return;
    this.fill.setAttribute('r', String(8 + b.level * 38));
    this.core.setAttribute('r', String(10 + b.level * 10));
    const r = b.rhythm;
    const inShare = r.inSeconds / (r.inSeconds + r.outSeconds);
    const g = b.guidePhase < inShare ? b.guidePhase / inShare : 1 - (b.guidePhase - inShare) / (1 - inShare);
    this.guide.setAttribute('stroke-dashoffset', String(308 * (1 - g)));
  }
}
