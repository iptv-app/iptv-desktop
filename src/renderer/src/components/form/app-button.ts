import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, THEME } from '../../assets/theme';

@customElement('app-button')
export class AppButton extends LitElement {
  tabIndex = 1;
  static styles = css`
    :host {
      background-color: ${THEME.BG_COLOR_TRANS};
      border: 2px solid ${THEME.BG_SECONDARY_COLOR};
      color: ${THEME.PRIMARY_COLOR};
      border-radius: 10px;
      height: 50px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding-left: 20px;
      padding-right: 20px;
      user-select: none;
    }
    :host(.primary) {
      background-color: ${THEME.PRIMARY_COLOR};
      color: ${THEME.PRIMARY_FG_COLOR};
      border: none;
    }
    :host(.icon) {
      width: 50px;
      padding-left: 0px;
      padding-right: 0px;
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
