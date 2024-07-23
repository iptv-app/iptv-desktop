import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, THEME } from '../../assets/theme';

@customElement('control-button')
export class ControlButton extends LitElement {
  tabIndex = 1;
  static styles = css`
    :host {
      background-color: ${THEME.BG_COLOR_TRANS};
      border: 2px solid ${THEME.BG_SECONDARY_COLOR};
      color: ${THEME.PRIMARY_COLOR};
      border-radius: 10px;
      height: 50px;
      width: 50px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    :host(.lg) {
      height: 70px;
      width: 70px;
    }
    :host(.lg) svg {
      height: 50px;
    }
    :host(:focus) {
      ${INPUT_FOCUS_STYLE}
    }
    :host(.circle) {
      border-radius: 50%;
    }
  `;

  protected render(): unknown {
    return html`<slot />`;
  }
}
