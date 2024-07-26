import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Milestone } from 'lucide-static';
import { THEME } from '../../assets/theme';

@customElement('empty-list')
export class EmptyList extends LitElement {
  @property()
  text?: string;

  static styles = css`
    :host {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .icon svg {
      color: ${THEME.PRIMARY_COLOR};
      height: 40px;
      width: 40px;
    }
  `;
  protected render(): unknown {
    return html`
      <span class="icon">${unsafeHTML(Milestone)}</span>
      <div>${this.text}</div>
    `;
  }
}
