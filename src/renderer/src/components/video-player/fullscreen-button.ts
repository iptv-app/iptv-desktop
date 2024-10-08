import { customElement, state } from 'lit/decorators.js';
import { html } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Maximize2, Minimize2 } from 'lucide-static';
import { AppButton } from '../form/app-button';

@customElement('fullscreen-button')
export class FullscreenButton extends AppButton {
  @state()
  _isFullScreen = false;
  constructor() {
    super();
    this.onclick = this._toggleFullScreen;
    this.classList.add('icon');
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.onfullscreenchange = this._updateFullScreenState;
    this._updateFullScreenState();
  }

  private _updateFullScreenState = () => {
    const isFullScreen = document.fullscreenElement !== null;
    this._isFullScreen = isFullScreen;
  };
  private _toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  protected render(): unknown {
    return html`${unsafeHTML(this._isFullScreen ? Minimize2 : Maximize2)}`;
  }
}
