import { TUNING } from '../config/tuning';
import { t } from '../core/content';
import { el, fadeIn, fadeOut, uiRoot } from './dom';

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};

/** One line that grows to 3, max 200 characters, a mic button if speech input exists. */
export class TextField {
  readonly root: HTMLElement;
  private area: HTMLTextAreaElement;

  constructor(onSend: (text: string) => void, onCancel: () => void) {
    this.area = el('textarea', {
      rows: 1,
      maxlength: TUNING.ai.textMax,
      placeholder: t('inner.placeholder'),
      'aria-label': t('inner.ownWords'),
      'data-testid': 'own-words',
    });
    const send = el('button', { class: 'lw-btn', 'data-testid': 'say-it' }, [t('inner.send')]);
    const submit = () => {
      const v = this.area.value.trim();
      if (v) onSend(v);
    };
    send.addEventListener('click', submit);
    this.area.addEventListener('input', () => {
      this.area.style.height = 'auto';
      this.area.style.height = `${Math.min(110, this.area.scrollHeight)}px`;
    });
    this.area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      } else if (e.key === 'Escape') onCancel();
    });
    const w = window as never as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Speech = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    let mic: HTMLButtonElement | null = null;
    if (Speech) {
      mic = el('button', { class: 'lw-mic', 'aria-label': t('a11y.mic'), 'aria-pressed': 'false', 'data-testid': 'mic' });
      mic.innerHTML =
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      let rec: InstanceType<SpeechCtor> | null = null;
      mic.addEventListener('click', () => {
        if (rec) {
          rec.stop();
          return;
        }
        try {
          rec = new Speech();
          rec.lang = 'en-US';
          rec.interimResults = false;
          rec.onresult = (e) => {
            const text = Array.from(e.results).map((r) => r[0]?.transcript ?? '').join(' ');
            this.area.value = `${this.area.value} ${text}`.trim().slice(0, TUNING.ai.textMax);
          };
          rec.onend = rec.onerror = () => {
            rec = null;
            mic?.setAttribute('aria-pressed', 'false');
          };
          rec.start();
          mic!.setAttribute('aria-pressed', 'true');
        } catch {
          rec = null;
        }
      });
    }
    this.root = el('div', { class: 'lw-textfield lw-panel lw-dark', 'data-testid': 'textfield' }, [this.area, mic, send]);
    uiRoot().append(this.root);
    fadeIn(this.root);
    this.area.focus();
  }

  close(): Promise<void> {
    return fadeOut(this.root);
  }
}
