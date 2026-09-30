import { TUNING } from '../config/tuning';
import { audio } from '../core/audio';
import { content, t } from '../core/content';
import { bus } from '../core/events';
import { reflect } from '../core/reflectClient';
import { router } from '../core/router';
import { memory } from '../core/save';
import type { ChipKey } from '../logic/contentTypes';
import { OTHER_THEME, soulChips, type ReflectResult } from '../logic/reflect';
import { isCrisis } from '../logic/safety';
import type { SceneSpec } from '../logic/sceneSpec';
import { buildInner, type BuiltInner } from '../inner/buildInner';
import { INNER } from '../render/materials/papercut';
import { BodyOutline, type BodyZone } from '../ui/BodyOutline';
import { Chips } from '../ui/Chips';
import { el, fadeIn, fadeOut, uiRoot } from '../ui/dom';
import { SeedCard } from '../ui/SeedCard';
import { TextField } from '../ui/TextField';
import { WorldText } from '../ui/WorldText';
import type { Connection } from './Connection';
import type { Game } from './Game';

type Closable = { close(): Promise<void> | void };

/** The inner journey: Soul → answer (1–2 rounds) → Heart → One → Seed. */
export class Journey {
  private built: BuiltInner | null = null;
  private ui: Closable[] = [];
  private body: BodyOutline | null = null;
  private history: { q: string; a: string }[] = [];
  private placeKey: ChipKey = 'unsure';
  private question = '';
  private oneBreaths = 0;
  private dimTarget = 0;
  private heartTimer: ReturnType<typeof setTimeout> | null = null;
  seed = '';
  zone: BodyZone | null = null;
  /** Consent panel hook (M7): resolves when the player has answered (or was asked before). */
  askConsent: () => Promise<void> = async () => undefined;
  /** Crisis hook (M7). */
  onCrisis: () => void = () => undefined;

  constructor(
    private readonly game: Game,
    private readonly conn: Connection,
  ) {
    conn.buildArrival = () => this.arrive();
    conn.arrived = () => this.soul();
    conn.cleanup = () => this.clearUi(true);
    conn.onInnerBreath = () => this.onBreath();
    conn.innerFrame = (dt) => {
      this.built?.update(dt);
      INNER.dim += (this.dimTarget - INNER.dim) * Math.min(1, dt * 1.2);
    };
  }

  private get d() {
    return this.conn.d!;
  }

  private get form(): string {
    const def = content().disturbances.types[this.d.type];
    return def.forms[this.d.state.formIndex];
  }

  private step(s: Parameters<typeof bus.emit<'inner:step'>>[1]['step']): void {
    bus.emit('inner:step', { step: s });
  }

  private arrive(): void {
    this.history = [];
    this.seed = '';
    this.zone = null;
    this.oneBreaths = 0;
    this.dimTarget = 0;
    INNER.dim = 0;
    // Before the first answer the inner world is almost empty: night, paper floor, motes.
    this.built = buildInner(this.conn.inner, { place: 'misty', parts: ['particles', 'openSpace'], hardElement: 'fog', lightLevel: 0.3 }, 'arrive', this.conn.reducedMotion, true);
  }

  private async clearUi(all = false): Promise<void> {
    const list = this.ui.splice(0);
    await Promise.all(list.map((u) => u.close()));
    if (all) {
      void this.body?.close();
      this.body = null;
      this.dimTarget = 0;
      if (this.heartTimer) clearTimeout(this.heartTimer);
    }
  }

  /** Soul: tap the floating words "What did you come to teach me?". */
  private soul(): void {
    this.conn.step = 'soul';
    this.step('soul');
    const b = el('button', { class: 'lw-soul lw-hand', 'data-testid': 'soul-ask' }, [t('soul.ask')]);
    b.addEventListener('click', () => {
      audio.chime(1, 0.14);
      void this.clearUi().then(() => this.ask(content().fallback.soul[this.d.type], soulChips(content().fallback, this.d.type), 'place'));
    });
    uiRoot().append(b);
    fadeIn(b);
    b.focus();
    this.ui.push({ close: () => fadeOut(b) });
  }

  /** Show the disturbance's question and the answer chips. */
  private ask(question: string, chips: string[], step: 'place' | 'theme'): void {
    this.conn.step = step === 'place' ? 'answer' : 'answer2';
    this.step(this.conn.step);
    this.question = question;
    const q = new WorldText(question, { inner: true, top: '24%', testid: 'question' });
    this.ui.push(q);
    const showChips = () => {
      const c = new Chips(
        chips,
        (text) => void this.answer(step, text, null),
        () => {
          void c.close();
          this.ui = this.ui.filter((u) => u !== c);
          void this.askConsent().then(() => {
            const f = new TextField(
              (text) => void this.answer(step, null, text),
              () => {
                void f.close();
                this.ui = this.ui.filter((u) => u !== f);
                showChips();
              },
            );
            this.ui.push(f);
          });
        },
      );
      this.ui.push(c);
    };
    showChips();
  }

  /** Test hook: answer with a chip index or own words. */
  answerNow(a: number | string): boolean {
    const s = this.conn.step;
    if (s !== 'answer' && s !== 'answer2') return false;
    const step = s === 'answer' ? 'place' : 'theme';
    if (typeof a === 'number') {
      const chip = document.querySelector(`[data-testid=chip-${a}]`)?.textContent;
      if (!chip) return false;
      void this.answer(step, chip, null);
    } else void this.answer(step, null, a);
    return true;
  }

  private busy = false;

  private async answer(step: 'place' | 'theme', chip: string | null, freeText: string | null): Promise<void> {
    if (this.busy) return;
    // Crisis check before anything is sent or stored.
    if (freeText && isCrisis(freeText)) {
      await this.clearUi(true);
      this.onCrisis();
      return;
    }
    this.busy = true;
    await this.clearUi();
    if (freeText) memory.addFreeText(freeText);
    const res: ReflectResult = await reflect({
      type: this.d.type,
      form: this.form,
      step,
      history: this.history,
      chip,
      freeText,
      placeKey: this.placeKey,
    });
    this.history.push({ q: this.question, a: freeText ?? chip ?? '' });
    this.busy = false;
    if (res.crisis) {
      await this.clearUi(true);
      this.onCrisis();
      return;
    }
    if (step === 'place') {
      if (res.placeKey) this.placeKey = res.placeKey;
      this.form3(res.sceneSpec!);
      audio.chime(0.9, 0.1);
      this.ask(res.question!, res.chips, 'theme');
      return;
    }
    this.conn.theme = res.theme ?? OTHER_THEME;
    this.seed = res.seed ?? '';
    for (const h of this.built?.parts.values() ?? []) h.warm?.();
    audio.chime(1.2, 0.12);
    this.heart();
  }

  /** The place forms from the first answer. */
  private form3(spec: SceneSpec): void {
    this.built = buildInner(this.conn.inner, spec, `${this.d.type}-${spec.place}-${spec.hardElement}`, this.conn.reducedMotion);
  }

  /** Heart: close your eyes 10 s, then tap where it was felt. */
  private heart(): void {
    this.conn.step = 'heart';
    this.step('heart');
    const w = new WorldText(t('heart.close'), { inner: true, top: '40%', testid: 'heart-close' });
    this.ui.push(w);
    this.dimTarget = 0.88;
    this.heartTimer = setTimeout(() => {
      audio.chime(1, 0.16);
      this.dimTarget = 0;
      void this.clearUi().then(() => {
        this.body = new BodyOutline((z) => this.feel(z));
      });
    }, TUNING.inner.heartSeconds * 1000);
  }

  /** Test hook: skip the 10 s wait. */
  heartNow(zone?: BodyZone): void {
    if (this.conn.step !== 'heart') return;
    if (this.heartTimer && !this.body) {
      clearTimeout(this.heartTimer);
      this.heartTimer = null;
      this.dimTarget = 0;
      void this.clearUi().then(() => {
        this.body = new BodyOutline((z) => this.feel(z));
        if (zone) this.feel(zone);
      });
    } else if (zone && this.body) this.feel(zone);
  }

  private feel(z: BodyZone): void {
    if (this.zone) return;
    this.zone = z;
    this.body?.mark(z);
    this.one();
  }

  /** One: look at the hard element and breathe. Each breath changes it one step; after 3 it is transformed. */
  private one(): void {
    this.conn.step = 'one';
    this.step('one');
    this.oneBreaths = 0;
    const w = new WorldText(t('one.prompt'), { inner: true, top: '18%', testid: 'one-prompt' });
    this.ui.push(w);
    this.game.breathAsked = true;
  }

  private onBreath(): void {
    if (this.conn.step !== 'one' || !this.built) return;
    this.oneBreaths++;
    this.built.hard.setStage?.(this.oneBreaths);
    audio.chime(0.8 + this.oneBreaths * 0.15, 0.12);
    if (this.built.spec.hardElement === 'wind' && this.oneBreaths >= 3 && this.built.plants) {
      this.built.plants.grow();
      this.built.plants.sway = 0.18;
    }
    if (this.oneBreaths >= TUNING.inner.oneBreaths) {
      this.game.breathAsked = false;
      setTimeout(() => void this.clearUi().then(() => this.seedStep()), TUNING.inner.stepSeconds * 1000);
    }
  }

  /** Debug: show one hard element fully transformed (inside only). */
  previewHard(hard: SceneSpec['hardElement'], stage = 3): void {
    if (router.state !== 'inner') return;
    const parts: SceneSpec['parts'] = [hard, 'light', 'particles'];
    this.built = buildInner(this.conn.inner, { place: 'misty', parts, hardElement: hard, lightLevel: 0.5 }, `preview-${hard}`, false);
    this.built.hard.setStage?.(stage);
  }

  /** Transformation progress of the hard element (tests). */
  progress(): number {
    return this.built?.hard.progress?.() ?? 0;
  }

  hardElement(): string | null {
    return this.built?.spec.hardElement ?? null;
  }

  /** Seed: read and edit one sentence, keep it. */
  private seedStep(): void {
    this.conn.step = 'seed';
    this.step('seed');
    const card = new SeedCard(this.seed || t('seed.fromTheme', { theme: this.conn.theme.toLowerCase() }), (text) => {
      memory.addSeed({ type: this.d.type, theme: this.conn.theme, text });
      memory.setTheme(this.d.type, this.conn.theme);
      bus.emit('seed:kept', { id: this.d.index, text });
      audio.chime(1.5, 0.14);
      this.conn.complete = true;
      void this.clearUi().then(() => this.conn.askReturn());
    });
    this.ui.push(card);
  }

  /** Called when leaving (return breath). */
  leaving(): void {
    void this.clearUi(true);
  }

  get stateName(): string {
    return router.state;
  }
}
