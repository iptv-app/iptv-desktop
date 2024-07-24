import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, INPUT_STYLE, THEME } from '../../assets/theme';
import { ChevronDown } from 'lucide-static';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

export interface Option {
  label: string;
  value: string;
}
@customElement('select-item')
export class SelectInput extends LitElement {
  tabIndex = 1;

  @property()
  value?: string;

  @property()
  placeholder?: string;

  @property({
    type: Boolean
  })
  disabled?: boolean;

  @property({
    reflect: false
  })
  options?: Option[];

  @state()
  _isOpen = false;

  constructor() {
    super();
    this.onblur = () => {
      if (this._isOpen) {
        this._isOpen = false;
      }
    };
  }

  protected onChange(val: string) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: val
      })
    );
    this._isOpen = false;
  }

  private _toggleOpen = () => {
    this._isOpen = !this._isOpen;
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    :host([disabled]) {
      background-color: ${THEME.BG_SECONDARY_COLOR};
      cursor: not-allowed;
      color: ${THEME.FG_COLOR_MUTED};
    }
    .placeholder {
      color: ${THEME.FG_COLOR_MUTED};
    }
    .container {
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      ${INPUT_STYLE}
      display: flex;
    }
    :host(:focus) .container {
      ${INPUT_FOCUS_STYLE}
    }
    .value {
      flex: 1;
      min-width: 0;
    }
    .items {
      position: absolute;
      list-style: none;
      left: 0;
      right: 0;
      background-color: ${THEME.BG_SECONDARY_COLOR};
      box-shadow: 0 0 20px ${THEME.BG_COLOR};
      border-radius: 5px;
      padding: 5px;
      transform: scaleY(0);
      transition: transform 0.2s ease;
      transform-origin: top center;
    }
    .items.open {
      transform: scaleY(1);
    }
    .items li {
      padding: 8px;
      border-radius: 5px;
      cursor: pointer;
    }
    .items li:hover {
      background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
    }
    .items li.active {
      background-color: ${THEME.PRIMARY_COLOR};
      color: ${THEME.PRIMARY_FG_COLOR};
    }
  `;

  protected render(): unknown {
    const selected = this.options?.find((item) => item.value === this.value);
    return html`
      <div class="container" @click=${this._toggleOpen}>
        <span class="value ${selected ? '' : 'placeholder'}"
          >${selected?.label ?? this.placeholder}</span
        >
        ${unsafeHTML(ChevronDown)}
      </div>
      <ul class="items ${this._isOpen ? 'open' : undefined}">
        ${this.options?.map((item) => {
          return html`<li
            class=${selected?.value === item.value ? 'active' : undefined}
            @click=${() => this.onChange(item.value)}
          >
            ${item.label}
          </li>`;
        })}
      </ul>
    `;
  }
}
