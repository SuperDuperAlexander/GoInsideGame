import { t } from '../core/content';
import { memory } from '../core/save';
import type { RhythmPreset } from '../config/tuning';
import { el, fadeIn, fadeOut, uiRoot } from './dom';
import { seedList } from './SeedBook';

/** A full-screen menu layer with one panel. Esc or the first button closes it. */
export class MenuLayer {
  readonly root: HTMLElement;
  readonly panel: HTMLElement;

  constructor(testid: string, extraClass = '') {
    this.panel = el('div', { class: 'lw-panel', role: 'dialog', 'aria-modal': 'true' });
    this.root = el('section', { class: `lw-screen lw-menu ${extraClass}`, 'data-testid': testid }, [this.panel]);
    uiRoot().append(this.root);
    fadeIn(this.root);
  }

  set(children: (Node | string | null)[]): void {
    this.panel.replaceChildren(...children.filter((c): c is Node | string => c !== null));
    (this.panel.querySelector('button, select, input') as HTMLElement | null)?.focus();
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}

export interface SettingsHandlers {
  onRhythm(r: RhythmPreset): void;
  onVolume(v: number): void;
  onMotion(v: boolean): void;
  onAi(v: boolean): void;
  onForget(): void;
  onBack(): void;
}

/** Breath rhythm, sound, reduced motion, AI reflection, forget everything. */
export function settingsContent(h: SettingsHandlers, layer: MenuLayer): (Node | string)[] {
  const s = memory.data.settings;
  const rhythm = el('select', { 'data-testid': 'set-rhythm', 'aria-label': t('settings.rhythm') }, (['normal', 'slow', 'easy'] as const).map((r) =>
    el('option', { value: r, selected: s.rhythm === r }, [t(`settings.rhythm.${r}`)]),
  ));
  rhythm.addEventListener('change', () => h.onRhythm(rhythm.value as RhythmPreset));
  const vol = el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.volume, 'data-testid': 'set-volume', 'aria-label': t('settings.sound') });
  vol.addEventListener('input', () => h.onVolume(Number(vol.value)));
  const motion = el('input', { type: 'checkbox', checked: s.reducedMotion, 'data-testid': 'set-motion', id: 'lw-motion' });
  motion.addEventListener('change', () => h.onMotion(motion.checked));
  const ai = el('input', { type: 'checkbox', checked: memory.data.aiConsent === true, 'data-testid': 'set-ai', id: 'lw-ai' });
  ai.addEventListener('change', () => h.onAi(ai.checked));
  const forget = el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'forget' }, [t('settings.forget')]);
  forget.addEventListener('click', () => {
    layer.set([
      el('p', {}, [t('settings.forget.confirm')]),
      el('button', { class: 'lw-btn', 'data-testid': 'forget-no', onclick: () => layer.set(settingsContent(h, layer)) }, [t('settings.forget.no')]),
      el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'forget-yes', onclick: () => h.onForget() }, [t('settings.forget.yes')]),
    ]);
  });
  return [
    el('h2', {}, [t('settings.title')]),
    el('label', { class: 'lw-row' }, [t('settings.rhythm'), rhythm]),
    el('label', { class: 'lw-row' }, [t('settings.sound'), vol]),
    el('label', { class: 'lw-row', for: 'lw-motion' }, [t('settings.motion'), motion]),
    el('label', { class: 'lw-row', for: 'lw-ai' }, [t('settings.ai'), ai]),
    forget,
    el('button', { class: 'lw-btn', 'data-testid': 'settings-back', onclick: () => h.onBack() }, [t('pause.resume')]),
  ];
}

export function aboutContent(onBack: () => void): (Node | string)[] {
  return [
    el('h2', {}, [t('about.title')]),
    el('p', {}, [t('about.body')]),
    el('p', {}, [t('about.privacy')]),
    el('button', { class: 'lw-btn', 'data-testid': 'about-back', onclick: onBack }, [t('pause.resume')]),
  ];
}

export function seedBookContent(onBack: () => void): (Node | string)[] {
  return [
    el('h2', {}, [t('seedBook.title')]),
    seedList(memory.data.seeds),
    el('button', { class: 'lw-btn', 'data-testid': 'seedbook-back', onclick: onBack }, [t('pause.resume')]),
  ];
}
