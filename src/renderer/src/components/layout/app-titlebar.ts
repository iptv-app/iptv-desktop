import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { THEME } from '../../assets/theme';

@customElement('app-titlebar')
export class AppTitlebar extends LitElement {
  @property()
  text?: string;

  connectedCallback(): void {
    super.connectedCallback();
    if (window.__appConfig?.userInterface?.isUseSystemTitlebar) {
      this.classList.add('system-bar');
    }
    document.addEventListener('fullscreenchange', this._updateFullScreenState);
    this._updateFullScreenState();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('fullscreenchange', this._updateFullScreenState);
  }

  private _updateFullScreenState = () => {
    const isFullScreen = document.fullscreenElement !== null;
    if (isFullScreen) {
      this.classList.add('fullscreen');
    } else {
      this.classList.remove('fullscreen');
    }
  };

  static styles = css`
    :host {
      height: env(titlebar-area-height, 30px);
      -webkit-app-region: drag;
      border-bottom: 1px solid ${THEME.BORDER_COLOR};
      position: relative;
    }
    :host(.fixed) {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
    }
    :host(.no-border) {
      border-bottom: none;
    }
    :host(.fullscreen) {
      display: none;
    }
    :host(.system-bar) {
      display: none;
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
  `;
  protected render(): unknown {
    return html`<div class="title">${this.text}</div>`;
  }
}
