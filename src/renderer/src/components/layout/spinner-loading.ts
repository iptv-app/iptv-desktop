import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { THEME } from '../../assets/theme';

@customElement('spinner-loading')
export class SpinnerLoading extends LitElement {
  static styles = css`
    :host {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
      justify-content: center;
    }
    .loader {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: inline-block;
      border-top: 4px solid ${THEME.FG_COLOR};
      border-right: 4px solid transparent;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
    }
    .loader::after {
      content: '';
      box-sizing: border-box;
      position: absolute;
      left: 0;
      top: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border-bottom: 4px solid ${THEME.PRIMARY_COLOR};
      border-left: 4px solid transparent;
    }
    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  protected render(): unknown {
    return html`
      <span class="loader"></span>
      <div>Loading...</div>
    `;
  }
}
