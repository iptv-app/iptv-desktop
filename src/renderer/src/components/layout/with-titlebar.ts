import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-titlebar';

@customElement('with-titlebar')
export class WithTitlebar extends LitElement {
  @property()
  text?: string;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    main {
      flex: 1;
      min-height: 0px;
      height: auto;
      display: block;
    }
  `;
  protected render(): unknown {
    return html`<app-titlebar text=${this.text}></app-titlebar>
      <main><slot></slot></main>`;
  }
}
