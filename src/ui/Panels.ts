import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

/** Asked once, the first time the player writes own words. */
export function askConsent(): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (v: boolean) => {
      void fadeOut(root);
      resolve(v);
    };
    const root = el('section', { class: 'lw-screen lw-menu', 'data-testid': 'consent' }, [
      el('div', { class: 'lw-panel lw-dark', role: 'dialog', 'aria-modal': 'true' }, [
        el('p', {}, [t('consent.text')]),
        el('div', { class: 'lw-links' }, [
          el('button', { class: 'lw-btn', 'data-testid': 'consent-yes', style: 'background: var(--inner-gold); color: var(--ui-text)', onclick: () => done(true) }, [t('consent.yes')]),
          el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'consent-no', style: 'color: var(--ui-textLight)', onclick: () => done(false) }, [t('consent.no')]),
        ]),
      ]),
    ]);
    uiRoot().append(root);
    fadeIn(root);
    (root.querySelector('button') as HTMLButtonElement).focus();
  });
}

/** Calm, dark, no animation. Help lines and Return. */
export function showHelp(onReturn: () => void): void {
  const root = el('section', { class: 'lw-screen lw-help', 'data-testid': 'help-panel', role: 'alertdialog', 'aria-modal': 'true' }, [
    el('div', { class: 'lw-panel lw-dark' }, [
      el('h2', {}, [t('help.title')]),
      el('p', {}, [t('help.body')]),
      el('p', {}, [t('help.lines')]),
      el('button', {
        class: 'lw-btn',
        'data-testid': 'help-return',
        onclick: () => {
          root.remove();
          onReturn();
        },
      }, [t('help.return')]),
    ]),
  ]);
  uiRoot().append(root);
  (root.querySelector('button') as HTMLButtonElement).focus();
}
