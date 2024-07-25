import { Level } from 'hls.js';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../form/app-button';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Settings } from 'lucide-static';
import './select-button';
import { SelectButtonOption } from './select-button';

@customElement('quality-button')
export class QualityButton extends LitElement {
  @property()
  qualities?: Level[];

  @property()
  activeIdx?: number;

  protected render(): unknown {
    const options: SelectButtonOption[] = [
      {
        label: 'Auto',
        value: -1
      },
      ...(this.qualities || []).map((item, idx) => ({
        label: item.name || item.height + 'p',
        value: idx
      }))
    ];
    return html` <select-button
      class="${!this.qualities || this.qualities.length <= 1 ? 'hidden' : ''}"
      .options=${options}
      .value=${this.activeIdx}
      @change=${(e: CustomEvent) =>
        this.dispatchEvent(new CustomEvent('change', { detail: e.detail }))}
      >${unsafeHTML(Settings)}
    </select-button>`;
  }
}
