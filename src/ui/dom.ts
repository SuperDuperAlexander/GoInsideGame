import { PALETTE } from '../config/palette';
import { TUNING } from '../config/tuning';

type Attrs = Record<string, string | number | boolean | undefined | ((e: Event) => void)>;

/** Tiny DOM builder. Strings in children become text nodes (never HTML). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string | null | undefined | false)[] = [],
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === 'function') e.addEventListener(k.replace(/^on/, '').toLowerCase(), v as EventListener);
    else if (k === 'class') e.className = String(v);
    else if (k === 'text') e.textContent = String(v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c) e.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}

export function uiRoot(): HTMLElement {
  return document.getElementById('ui')!;
}

export function fadeIn(e: HTMLElement): void {
  e.classList.add('lw-fade');
  e.classList.remove('lw-hidden');
  void e.offsetWidth;
  e.classList.add('lw-shown');
}

export function fadeOut(e: HTMLElement, remove = true): Promise<void> {
  e.classList.remove('lw-shown');
  return new Promise((res) =>
    setTimeout(() => {
      if (remove) e.remove();
      else e.classList.add('lw-hidden');
      res();
    }, TUNING.motion.fadeOut),
  );
}

/** Writes the palette into CSS variables, so styles.css holds no colour of its own. */
export function applyTheme(): void {
  const r = document.documentElement.style;
  const set = (name: string, v: string) => r.setProperty(`--${name}`, v);
  for (const [k, v] of Object.entries(PALETTE.ui)) set(`ui-${k}`, v);
  for (const [k, v] of Object.entries(PALETTE.inner)) set(`inner-${k}`, v);
  for (const [k, v] of Object.entries(PALETTE.outer)) set(`outer-${k}`, v);
  for (const [k, v] of Object.entries(PALETTE.player)) set(`player-${k}`, v);
  for (const [k, v] of Object.entries(PALETTE.disturb)) set(`d-${k}`, v);
  set('fade-in', `${TUNING.motion.fadeIn}ms`);
  set('fade-out', `${TUNING.motion.fadeOut}ms`);
}
