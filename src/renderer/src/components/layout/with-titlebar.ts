import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { THEME } from '../../assets/theme';

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
    #titlebar {
      height: env(titlebar-area-height, 30px);
      -webkit-app-region: drag;
      border-bottom: 1px solid ${THEME.BORDER_COLOR};
      position: relative;
    }
    .title {
      position: absolute;
      left: env(titlebar-area-x, 0);
      width: env(titlebar-area-width, 100%);
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      padding-left: 10px;
      padding-right: 10px;
    }
    main {
      flex: 1;
      min-height: 0px;
      height: auto;
      display: block;
    }
  `;
  protected render(): unknown {
    return html`<div id="titlebar"><div class="title">${this.text}</div></div>
      <main><slot></slot></main>`;
  }
}
