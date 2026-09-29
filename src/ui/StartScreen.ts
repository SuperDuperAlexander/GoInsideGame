import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

export interface StartScreenOptions {
  canContinue: boolean;
  onBegin: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onAbout: () => void;
}

/** Title, one line, Begin, Settings, About, build stamp. */
export class StartScreen {
  readonly root: HTMLElement;

  constructor(o: StartScreenOptions) {
    const begin = el('button', { class: 'lw-btn', 'data-testid': 'begin', onclick: () => o.onBegin() }, [
      t('start.begin'),
    ]);
    const cont = o.canContinue
      ? el('button', { class: 'lw-btn', 'data-testid': 'continue', onclick: () => o.onContinue() }, [
          t('start.continue'),
        ])
      : null;
    this.root = el('section', { class: 'lw-screen lw-start', 'data-testid': 'start-screen' }, [
      el('div', { class: 'lw-panel' }, [
        el('h1', { class: 'lw-title' }, [t('title')]),
        el('p', { class: 'lw-line' }, [t('start.line')]),
        cont ?? begin,
        el('div', { class: 'lw-links' }, [
          cont ? el('button', { class: 'lw-btn lw-quiet', onclick: () => o.onBegin() }, [t('start.begin')]) : null,
          el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'settings', onclick: () => o.onSettings() }, [
            t('start.settings'),
          ]),
          el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'about', onclick: () => o.onAbout() }, [
            t('start.about'),
          ]),
        ]),
      ]),
      el('div', { class: 'lw-stamp', 'data-testid': 'stamp' }, [`build ${import.meta.env.VITE_COMMIT}`]),
    ]);
    uiRoot().append(this.root);
    fadeIn(this.root);
    (cont ?? begin).focus();
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
