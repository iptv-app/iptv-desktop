import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { THEME } from '../assets/theme';
import LogoPlaceholder from '../assets/logo-placeholder.png?url';

@customElement('channel-item')
export class ChannelItem extends LitElement {
  tabIndex = 0;

  constructor() {
    super();

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.click();
      }
    });
  }

  @property()
  isVertical?: boolean;

  @property()
  logo?: string;

  @property()
  name?: string;

  static styles = css`
    :host {
      background-color: ${THEME.BG_SECONDARY_COLOR};
      padding: 15px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      gap: 15px;
      user-select: none;
    }
    :host(.vertical) {
      flex-direction: row;
      align-items: center;
      background-color: transparent;
    }
    :host(.active) {
      background-color: ${THEME.PRIMARY_COLOR} !important;
      color: ${THEME.PRIMARY_FG_COLOR} !important;
    }
    :host(:hover) {
      background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
    }

    :host(.vertical:hover) {
      background-color: ${THEME.BG_COLOR_TRANS};
    }
    :host(:focus) {
      outline: 2px solid ${THEME.PRIMARY_COLOR};
      outline-offset: 2px;
    }
    :host .logo {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${THEME.CHANNEL_BG_COLOR};
      border-radius: 5px;
      padding: 16px;
      width: 100%;
      box-sizing: border-box;
    }
    :host(.vertical) .logo {
      width: 120px;
      height: 60px;
      padding: 6px;
    }
    :host .logo img {
      object-fit: contain;
      width: 100%;
      height: 100%;
      max-width: 150px;
    }
    :host h3 {
      margin: 0;
      text-align: center;
    }
    :host(.vertical) h3 {
      text-align: left;
      flex: 1;
    }
  `;

  protected render(): unknown {
    return html`
      <div class="logo">
        <img loading="lazy" onerror="this.src='${LogoPlaceholder}'" src="${this.logo}" alt="" />
      </div>
      <h3>${this.name}</h3>
    `;
  }
}
