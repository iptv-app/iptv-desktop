import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { TriangleAlert } from 'lucide-static';
import { THEME } from '../../assets/theme';
import '../form/app-button';

@customElement('player-error')
export class SpinnerLoading extends LitElement {
  @property()
  details?: Error;

  @property()
  reason?: string;

  @property({ type: Boolean })
  canFallback = false;

  @property()
  streamIndex?: number;

  @property()
  streamCount?: number;

  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 30;
      pointer-events: auto;
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
    .reason {
      max-width: 70vw;
      text-align: center;
      opacity: 0.9;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
  `;
  protected render(): unknown {
    const fallbackLabel =
      this.streamCount && this.streamIndex !== undefined
        ? `Fallback Stream (${this.streamIndex + 2}/${this.streamCount})`
        : 'Fallback Stream';
    return html`<div>${unsafeHTML(TriangleAlert)}</div>
      <div>Failed To Load Video!</div>
      <div class="reason">${this.reason || this.details?.message || this.details}</div>
      <div class="actions">
        <app-button class="primary" @click=${() => this.dispatchEvent(new CustomEvent('retry'))}
          >Retry</app-button
        >
        ${this.canFallback
          ? html`<app-button @click=${() => this.dispatchEvent(new CustomEvent('fallback'))}
              >${fallbackLabel}</app-button
            >`
          : undefined}
      </div>`;
  }
}
