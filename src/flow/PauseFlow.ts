import { audio } from '../core/audio';
import { t } from '../core/content';
import { bus } from '../core/events';
import { router } from '../core/router';
import { memory } from '../core/save';
import { el, uiRoot } from '../ui/dom';
import { MenuLayer, aboutContent, seedBookContent, settingsContent, type SettingsHandlers } from '../ui/Menus';
import type { Game } from './Game';

/** Pause (Esc / pause button), Seed Book, Settings, About. */
export class PauseFlow {
  private layer: MenuLayer | null = null;
  readonly button: HTMLButtonElement;

  constructor(private readonly game: Game) {
    this.button = el('button', { class: 'lw-pause lw-hidden', 'aria-label': t('a11y.pause'), 'data-testid': 'pause-button' });
    this.button.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
    this.button.addEventListener('click', () => this.toggle());
    uiRoot().append(this.button);
    bus.on('input:pause', () => this.toggle());
    game.tickers.push(() => {
      const s = router.state;
      const show = ['outer', 'choosing', 'inner'].includes(s);
      this.button.classList.toggle('lw-hidden', !show);
    });
  }

  handlers(back: () => void): SettingsHandlers {
    return {
      onRhythm: (r) => {
        memory.data.settings.rhythm = r;
        memory.save();
        this.game.breath.setPreset(r);
      },
      onVolume: (v) => {
        memory.data.settings.volume = v;
        memory.save();
        audio.setVolume(v);
      },
      onMotion: (v) => {
        memory.data.settings.reducedMotion = v;
        memory.save();
        document.documentElement.classList.toggle('lw-reduced', v);
      },
      onAi: (v) => memory.setConsent(v),
      onForget: () => {
        memory.forgetEverything();
        location.reload();
      },
      onBack: back,
    };
  }

  toggle(): void {
    if (this.layer) {
      this.resume();
      return;
    }
    if (!['outer', 'choosing', 'inner'].includes(router.state)) return;
    router.go('paused');
    this.layer = new MenuLayer('pause-menu');
    this.main();
  }

  private main(): void {
    const l = this.layer!;
    l.set([
      el('h2', {}, [t('pause.title')]),
      el('button', { class: 'lw-btn', 'data-testid': 'resume', onclick: () => this.resume() }, [t('pause.resume')]),
      el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'open-seedbook', onclick: () => l.set(seedBookContent(() => this.main())) }, [
        t('pause.seedBook'),
      ]),
      el('button', { class: 'lw-btn lw-quiet', 'data-testid': 'open-settings', onclick: () => l.set(settingsContent(this.handlers(() => this.main()), l)) }, [
        t('start.settings'),
      ]),
    ]);
  }

  resume(): void {
    void this.layer?.close();
    this.layer = null;
    if (router.state === 'paused') router.resume();
    this.game.input.keys.clear();
  }

  /** From the start screen. */
  openSettings(onClose: () => void): void {
    const l = new MenuLayer('settings-menu');
    l.set(settingsContent(this.handlers(() => void l.close().then(onClose)), l));
  }

  openAbout(onClose: () => void): void {
    const l = new MenuLayer('about-page');
    l.set(aboutContent(() => void l.close().then(onClose)));
  }
}
