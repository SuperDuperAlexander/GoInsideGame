import { el, fadeIn, fadeOut, uiRoot } from './dom';

/** A quiet hint pill at the bottom centre. */
export class Hint {
  private root: HTMLElement | null = null;
  private text = '';

  show(text: string, dark = false, testid = 'hint'): void {
    if (this.root && this.text === text) return;
    this.hide();
    this.text = text;
    this.root = el('div', { class: `lw-hint${dark ? ' lw-dark' : ''}`, 'data-testid': testid, role: 'status' }, [text]);
    uiRoot().append(this.root);
    fadeIn(this.root);
  }

  hide(): void {
    if (!this.root) return;
    void fadeOut(this.root);
    this.root = null;
    this.text = '';
  }

  get visible(): boolean {
    return !!this.root;
  }
}
