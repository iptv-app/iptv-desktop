import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { THEME } from '../assets/theme';
import { ChevronDown } from 'lucide-static';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { FILTER_TYPE } from '../../../preload/iptv.type';

const TYPES: { [key in FILTER_TYPE]: string } = {
  country: 'Country',
  category: 'Category',
  language: 'Language'
};

@customElement('filter-select')
export class FilterSelect extends LitElement {
  @property()
  value?: FILTER_TYPE;

  @state()
  _isOpen = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      user-select: none;
    }
    :host h2 {
      margin: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
    }
    :host ul {
      list-style: none;
      background-color: ${THEME.BG_SECONDARY_COLOR};
      position: absolute;
      box-shadow: 0 0 20px ${THEME.BG_COLOR};
      padding: 0;
      left: 10px;
      right: 10px;
      padding: 5px;
      top: 40px;
      border-radius: 5px;
      transform: scaleY(0);
      transition:
        transform 0.2s ease,
        opacity 0.1s ease;
      opacity: 0;
      transform-origin: top center;
    }
    :host ul.open {
      opacity: 1;
      transform: scaleY(1);
    }
    :host ul li {
      padding: 8px;
      border-radius: 5px;
      margin: 5px;
      cursor: pointer;
      font-weight: bold;
    }

    :host ul li:hover {
      background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
    }

    :host ul li.active {
      background-color: ${THEME.PRIMARY_COLOR};
      color: ${THEME.PRIMARY_FG_COLOR};
    }
  `;

  private _onChangeValue = (newValue: string) => {
    const ev = new CustomEvent('changeValue', {
      detail: { value: newValue }
    });
    this.dispatchEvent(ev);
    this._isOpen = false;
  };

  private _toggleOpen = () => {
    this._isOpen = !this._isOpen;
  };

  protected render(): unknown {
    return html` <h2 class="label" @click="${this._toggleOpen}">
        ${this.value && TYPES[this.value] ? TYPES[this.value] : 'Choose...'}
        ${unsafeHTML(ChevronDown)}
      </h2>
      <ul class="${this._isOpen ? 'open' : ''}">
        ${Object.keys(TYPES).map(
          (key) =>
            html`<li
              @click="${() => this._onChangeValue(key)}"
              class="${this.value === key ? 'active' : ''}"
            >
              ${TYPES[key]}
            </li>`
        )}
      </ul>`;
  }
}
