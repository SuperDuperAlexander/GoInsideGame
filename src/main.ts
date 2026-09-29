import './ui/styles.css';
import { loadContent } from './core/content';
import { router } from './core/router';
import { applyTheme } from './ui/dom';
import { StartScreen } from './ui/StartScreen';

async function boot(): Promise<void> {
  applyTheme();
  await loadContent();
  router.go('start');
  new StartScreen({
    canContinue: false,
    onBegin: () => undefined,
    onContinue: () => undefined,
    onSettings: () => undefined,
    onAbout: () => undefined,
  });
}

void boot();
