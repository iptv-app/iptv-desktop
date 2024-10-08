import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { ChevronLeft } from 'lucide-static';
import { INPUT_FOCUS_STYLE, THEME } from '../../assets/theme';

@customElement('page-title')
export class PageTitle extends LitElement {
  @property()
  text?: string;

  @property()
  backHref?: string;

  static styles = css`
    :host {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .left {
      flex: 1;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 30px;
      width: 30px;
      border-radius: 5px;
      color: ${THEME.PRIMARY_COLOR};
      -webkit-user-drag: none;
    }
    a svg {
      height: 28px;
    }
    a:focus {
      ${INPUT_FOCUS_STYLE}
    }
    h1 {
      margin: 0;
      padding: 0;
      user-select: none;
    }
  `;

  protected render(): unknown {
    return html`
      <div class="left">
        ${this.backHref ? html`<a href="${this.backHref}">${unsafeHTML(ChevronLeft)}</a>` : ''}
        <h1>${this.text}</h1>
      </div>
    `;
  }
}
