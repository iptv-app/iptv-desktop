import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../form/app-button';
import { SCROLLBAR_STYLE, THEME } from '../../assets/theme';

export interface SelectButtonOption {
  label: string;
  value: number | string;
}

@customElement('select-button')
export class SelectButton extends LitElement {
  @property()
  options?: SelectButtonOption[];

  @property()
  value?: SelectButtonOption['value'];

  @state()
  _isOpen = false;

  private _change = (value: SelectButtonOption['value']) => {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: value
      })
    );
    this._isOpen = false;
  };

  static styles = [
    SCROLLBAR_STYLE,
    css`
      :host(.hidden) {
        display: none;
      }
      .container {
        position: relative;
      }
      ul {
        position: absolute;
        top: -20px;
        padding: 5px;
        list-style: none;
        background-color: ${THEME.BG_COLOR_TRANS};
        border: 1px solid ${THEME.BORDER_COLOR};
        width: 150px;
        left: -70px;
        border-radius: 5px;
        font-size: 1rem;
        transform: scaleY(0) translateY(-100%);
        transform-origin: top center;
        transition:
          transform 0.2s ease,
          opacity 0.1s ease;
        max-height: 200px;
        overflow-y: auto;
      }
      ul.open {
        opacity: 1;
        transform: scaleY(1) translateY(-100%);
      }
      li {
        padding: 8px;
        border-radius: 5px;
        margin: 5px;
        cursor: pointer;
        font-weight: bold;
      }
      li:hover {
        background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
      }
      li.active {
        background-color: ${THEME.PRIMARY_COLOR};
        color: ${THEME.PRIMARY_FG_COLOR};
      }
    `
  ];

  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  protected render(): unknown {
    return html`<div class="container">
      <ul class=${this._isOpen ? 'open' : ''}>
        ${this.options?.map(
          (item) =>
            html`<li
              @click=${() => this._change(item.value)}
              class=${item.value === this.value ? 'active' : ''}
            >
              ${item.label}
            </li>`
        )}
      </ul>
      <app-button
        @blur=${() => (this._isOpen = false)}
        @click=${() => (this._isOpen = !this._isOpen)}
        class="icon"
        ><slot
      /></app-button>
    </div>`;
  }
}
