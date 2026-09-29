import './ui/styles.css';
import { content, loadContent, t } from './core/content';
import { flags } from './core/flags';
import { router } from './core/router';
import { memory } from './core/save';
import { Game } from './flow/Game';
import { Connection } from './flow/Connection';
import { Journey } from './flow/Journey';
import { Loop } from './flow/Loop';
import { PauseFlow } from './flow/PauseFlow';
import { askConsent, showHelp } from './ui/Panels';
import { aiMode } from './core/reflectClient';
import { applyTheme, el, uiRoot } from './ui/dom';
import { CardPicker } from './ui/CardPicker';
import { StartScreen } from './ui/StartScreen';

declare global {
  interface Window {
    __lw: Record<string, unknown>;
  }
}

async function boot(): Promise<void> {
  applyTheme();
  if (flags.reducedmotion) memory.data.settings.reducedMotion = true;
  await loadContent();
  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  const game = new Game(canvas);
  const connection = new Connection(game);
  const journey = new Journey(game, connection);
  const loop = new Loop(game, connection);
  const pause = new PauseFlow(game);
  game.aiMode = aiMode;
  journey.askConsent = async () => {
    if (flags.noai || memory.data.aiConsent !== null) return;
    memory.setConsent(await askConsent());
  };
  journey.onCrisis = () => connection.toHelp(() => showHelp(() => connection.backFromHelp()));
  document.documentElement.classList.toggle('lw-reduced', memory.data.settings.reducedMotion);
  window.__lw = {
    state: () => router.state,
    stats: () => game.stats(),
    teleport: (x: number, z: number, h?: number) => game.teleport(x, z, h),
    addZone: (x: number, z: number, r: number) => game.outer.zones.add(x, z, r),
    sample: (fx?: number, fy?: number, size?: number) => game.sample(fx, fy, size),
    look: (yaw: number, pitch?: number) => {
      game.outer.camera.yaw = yaw;
      if (pitch !== undefined) game.outer.camera.pitch = pitch;
    },
    breathe: () => game.breathe(),
    push: () => game.tryPush(),
    choose: (c: 'within' | 'outside') => game.choose(c),
    returnNow: () => connection.returnNow(),
    answer: (a: number | string) => journey.answerNow(a),
    heart: (zone?: string) => journey.heartNow(zone as never),
    progress: () => journey.progress(),
    previewHard: (h: string, stage?: number) => journey.previewHard(h as never, stage),
    hardElement: () => journey.hardElement(),
    theme: () => connection.theme,
    step: () => connection.step,
    innerMeshes: () => connection.inner.meshCount,
    heap: () => (performance as never as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0,
    sceneCounts: () => ({ outer: game.outer.scene.meshes.length, inner: connection.inner.scene.meshes.length, materials: game.outer.scene.materials.length + connection.inner.scene.materials.length, textures: connection.inner.scene.textures.length }),
    disturbances: () =>
      game.disturbances.map((d) => ({
        type: d.type,
        lane: content().chapter.lanes[d.index].id,
        x: d.collider.x,
        z: d.collider.z,
        r: d.collider.r,
        scale: d.root.scaling.x,
        ...d.state.snapshot(),
      })),
    reach: () => {
      const m = game.outer.map;
      const s = content().chapter.start;
      const f = m.reach(s.x, s.z);
      return { terraces: m.terraces.map((p) => f(p.x, p.z)), gate: f(m.beyondGate.x, m.beyondGate.z) };
    },
    restlessness: () => game.restless.value,
    strollerPace: () => game.outer.figures.meanSpeed,
    memory: () => memory.data,
    endChapter: () => loop.end(),
    connected: () => loop.connectedCount,
    fountain: () => game.outer.fountain.fill,
    pause: () => pause.toggle(),
    echoes: () => game.echo.shown,
  };

  router.go('start');
  const canContinue = memory.hasProgress;

  const toPicker = async () => {
    await screen.close();
    router.go('picker');
    const picker = new CardPicker(content().disturbances.order, async (picks) => {
      memory.setPicks(picks);
      game.setupDisturbances(picks);
      await picker.close();
      router.go('opening');
      game.startOpening();
    });
    if (flags.autopick) picker.pick(content().disturbances.order.slice(0, 3));
    if (flags.autopick) (picker.root.querySelector('[data-testid=picker-continue]') as HTMLButtonElement).click();
  };
  const toContinue = async () => {
    await screen.close();
    game.setupDisturbances(memory.data.picks);
    loop.restore();
    const c = memory.data.checkpoint;
    if (c) game.teleport(c.x, c.z, c.heading);
    router.go('outer');
  };
  const screen = new StartScreen({
    canContinue,
    onBegin: () => void toPicker(),
    onContinue: () => void toContinue(),
    onSettings: () => pause.openSettings(() => undefined),
    onAbout: () => pause.openAbout(() => undefined),
  });
  if (flags.autostart) void (canContinue && !flags.autopick ? toContinue() : toPicker());
}

boot().catch((e: unknown) => {
  console.error(e);
  router.force('error');
  let msg = 'The world could not open.';
  let retry = 'Try again';
  try {
    msg = t('error.start') || msg;
    retry = t('error.retry') || retry;
  } catch {
    // content not loaded
  }
  uiRoot().append(
    el('section', { class: 'lw-screen' }, [
      el('div', { class: 'lw-panel lw-error' }, [
        el('p', {}, [msg]),
        el('button', { class: 'lw-btn', onclick: () => location.reload() }, [retry]),
      ]),
    ]),
  );
});
