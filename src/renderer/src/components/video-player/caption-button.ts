import { MediaPlaylist } from 'hls.js';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../form/app-button';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Captions, CaptionsOff } from 'lucide-static';
import './select-button';
import { SelectButtonOption } from './select-button';

@customElement('caption-button')
export class CaptionButton extends LitElement {
  @property()
  captions?: MediaPlaylist[];

  @property()
  activeIdx?: number;

  protected render(): unknown {
    const options: SelectButtonOption[] = [
      {
        label: 'Disabled',
        value: -1
      },
      ...(this.captions || []).map((item, idx) => ({
        label: item.name,
        value: idx
      }))
    ];
    return html` <select-button
      class="${!this.captions || this.captions.length <= 0 ? 'hidden' : ''}"
      .options=${options}
      .value=${this.activeIdx}
      @change=${(e: CustomEvent) =>
        this.dispatchEvent(new CustomEvent('change', { detail: e.detail }))}
      >${unsafeHTML(this.activeIdx === undefined || this.activeIdx === -1 ? CaptionsOff : Captions)}
    </select-button>`;
  }
}
