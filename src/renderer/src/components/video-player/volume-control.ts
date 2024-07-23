import { customElement, property } from 'lit/decorators.js';
import { ControlButton } from './control-button';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Volume2, VolumeX } from 'lucide-static';
import { css, html } from 'lit';
import { THEME } from '../../assets/theme';
@customElement('volume-control')
export class VolumeControl extends ControlButton {
  @property()
  volume?: number;

  @property()
  isMuted?: boolean;

  private _handleChangeVolume = (e) => {
    const volume = Number(e.target.value);
    const event = new CustomEvent('volumeChange', {
      detail: {
        volume
      }
    });
    this.dispatchEvent(event);
  };

  private _toggleMuted = () => {
    const event = new CustomEvent('toggleMuted');
    this.dispatchEvent(event);
  };

  static styles = css`
    ${super.styles}
    :host {
      width: auto;
      padding-left: 10px;
      padding-right: 10px;
      cursor: default;
      display: flex;
      gap: 5px;
    }
    button {
      background-color: transparent;
      color: ${THEME.PRIMARY_COLOR};
      padding: 0;
      cursor: pointer;
      border: none;
    }
    input {
      width: 100px;
      accent-color: ${THEME.PRIMARY_COLOR};
    }
  `;

  protected render(): unknown {
    return html`<button @click=${this._toggleMuted}>
        ${unsafeHTML(this.isMuted ? VolumeX : Volume2)}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        @input=${this._handleChangeVolume}
        .value=${this.volume}
      />`;
  }
}
