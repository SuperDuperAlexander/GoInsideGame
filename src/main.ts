import './ui/styles.css';
import { loadContent, t } from './core/content';
import { flags } from './core/flags';
import { router } from './core/router';
import { Game } from './flow/Game';
import { applyTheme, el, uiRoot } from './ui/dom';
import { StartScreen } from './ui/StartScreen';

declare global {
  interface Window {
    __lw: Record<string, unknown>;
  }
}

async function boot(): Promise<void> {
  applyTheme();
  await loadContent();
  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  const game = new Game(canvas);
  window.__lw = {
    state: () => router.state,
    stats: () => game.stats(),
    teleport: (x: number, z: number, h?: number) => game.teleport(x, z, h),
  };
  router.go('start');
  const begin = async () => {
    await screen.close();
    router.go('outer');
  };
  const screen = new StartScreen({
    canContinue: false,
    onBegin: begin,
    onContinue: begin,
    onSettings: () => undefined,
    onAbout: () => undefined,
  });
  if (flags.autostart) void begin();
}

boot().catch((e: unknown) => {
  console.error(e);
  router.force('error');
  let msg = 'The world could not open.';
  try {
    msg = t('error.start') || msg;
  } catch {
    // content not loaded
  }
  uiRoot().append(
    el('section', { class: 'lw-screen' }, [
      el('div', { class: 'lw-panel lw-error' }, [
        el('p', {}, [msg]),
        el('button', { class: 'lw-btn', onclick: () => location.reload() }, ['Try again']),
      ]),
    ]),
  );
});
