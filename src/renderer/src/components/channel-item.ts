import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { THEME } from '../assets/theme';
import LogoPlaceholder from '../assets/logo-placeholder.png?url';
import { Heart } from 'lucide-static';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

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

  @property()
  channelId?: string;

  @property({ type: Boolean })
  isFavorite: boolean = false;

  @state()
  private _logoSrc: string = LogoPlaceholder;

  @state()
  private _isResolvingLogo = false;

  private _toggleFavorite = async (e: Event) => {
    e.stopPropagation();
    if (this.channelId) {
      const newVal = await window.api.toggleFavorite(this.channelId);
      this.isFavorite = newVal;
      this.dispatchEvent(new CustomEvent('favorite-toggled', { bubbles: true, composed: true, detail: { channelId: this.channelId, isFavorite: newVal } }));
    }
  };

  protected updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('logo') || changedProperties.has('channelId')) {
      this._logoSrc = this.logo || LogoPlaceholder;
      void this._resolveLogo();
    }
  }

  private _resolveLogo = async (failedLogo?: string) => {
    if (!this.channelId || this._isResolvingLogo) return;
    this._isResolvingLogo = true;
    try {
      const resolved = await window.api.resolveChannelLogo(this.channelId, failedLogo);
      if (resolved && resolved !== this._logoSrc) {
        this._logoSrc = resolved;
      }
    } finally {
      this._isResolvingLogo = false;
    }
  };

  private _onImageError = async () => {
    if (this._logoSrc !== LogoPlaceholder) {
      const failedLogo = this._logoSrc;
      await this._resolveLogo(failedLogo);
      if (this._logoSrc !== failedLogo) return;
    }
    this._logoSrc = LogoPlaceholder;
  };

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
      min-width: 0;
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
      position: relative;
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
    .favorite-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: #fff;
    }
    .favorite-btn:hover {
      background: rgba(0,0,0,0.8);
      color: red;
    }
    .favorite-btn.active {
      color: red;
    }
    .favorite-btn.active svg {
      fill: red;
      stroke: red;
    }
    .favorite-btn svg {
      width: 16px;
      height: 16px;
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
        <div class="favorite-btn ${this.isFavorite ? 'active' : ''}" @click="${this._toggleFavorite}">
          ${unsafeHTML(Heart)}
        </div>
        <img loading="lazy" @error=${this._onImageError} src="${this._logoSrc}" alt="" />
      </div>
      <h3>${this.name}</h3>
    `;
  }
}
