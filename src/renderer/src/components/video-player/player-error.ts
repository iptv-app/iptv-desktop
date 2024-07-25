import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { TriangleAlert } from 'lucide-static';
import { THEME } from '../../assets/theme';

@customElement('player-error')
export class SpinnerLoading extends LitElement {
  @property()
  details?: Error;

  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    :host(.hidden) {
      display: none;
    }
    svg {
      height: 50px;
      width: 50px;
      color: ${THEME.PRIMARY_COLOR};
    }
  `;
  protected render(): unknown {
    return html`<div>${unsafeHTML(TriangleAlert)}</div>
      <div>Failed To Load Video!</div>
      <div>${this.details}</div>`;
  }
}
