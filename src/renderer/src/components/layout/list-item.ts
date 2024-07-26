import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { THEME } from '../../assets/theme';

@customElement('list-item')
export class ListItem extends LitElement {
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
  label?: string;

  @property()
  icon?: string;

  static styles = css`
    :host {
      user-select: none;
      display: flex;
      gap: 10px;
      background-color: ${THEME.BG_SECONDARY_COLOR};
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      align-items: center;
    }
    :host .label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host(.lg) .label {
      font-size: 1.2rem;
    }
    :host(.bold) .label {
      font-weight: bold;
    }
    :host(:hover) {
      background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
    }
    :host(:focus) {
      outline: 2px solid ${THEME.PRIMARY_COLOR};
      outline-offset: 2px;
    }
    :host(.active) {
      background-color: ${THEME.PRIMARY_COLOR};
      color: ${THEME.PRIMARY_FG_COLOR};
      font-weight: bold;
    }
    .icon {
      font-family: 'Noto Color Emoji';
    }
  `;

  protected render(): unknown {
    return html`${this.icon
        ? html`<span class="icon">${this.icon}</span>`
        : html`<div class="custom-icon"><slot name="icon" /></div>`}
      <span class="label" title="${this.label}">${this.label}</span> `;
  }
}
