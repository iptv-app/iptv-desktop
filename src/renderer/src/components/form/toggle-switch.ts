import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, THEME } from '../../assets/theme';

@customElement('toggle-switch')
export class ToggleSwitch extends LitElement {
  tabIndex = 1;
  @property({
    reflect: true,
    type: Boolean
  })
  checked?: boolean;

  constructor() {
    super();
    this.onclick = () => {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: this.checked ? false : true
        })
      );
    };
  }

  static styles = css`
    :host {
      height: 25px;
      width: 50px;
      background-color: ${THEME.BG_SECONDARY_COLOR};
      border-radius: 25px;
      display: inline-block;
      position: relative;
      cursor: pointer;
      transition: background-color 0.5s ease;
    }
    :host([checked]) {
      background-color: ${THEME.PRIMARY_COLOR};
    }
    span {
      border-radius: 50%;
      height: 15px;
      width: 15px;
      background-color: ${THEME.PRIMARY_COLOR};
      display: inline-block;
      position: absolute;
      top: 5px;
      left: 5px;
      transition:
        left 0.5s ease,
        background-color 0.5s ease;
    }
    :host([checked]) span {
      background-color: ${THEME.PRIMARY_FG_COLOR};
      left: 30px;
    }
    :host(:focus) {
      ${INPUT_FOCUS_STYLE}
    }
  `;

  protected render(): unknown {
    return html`<span></span>`;
  }
}
