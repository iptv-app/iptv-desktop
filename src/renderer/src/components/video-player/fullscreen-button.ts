import { customElement, state } from 'lit/decorators.js';
import { ControlButton } from './control-button';
import { html } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Maximize2, Minimize2 } from 'lucide-static';

@customElement('fullscreen-button')
export class FullscreenButton extends ControlButton {
  @state()
  _isFullScreen = false;
  constructor() {
    super();
    this._updateFullScreenState();
    this.onclick = this._toggleFullScreen;
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
    this._updateFullScreenState();
  };

  protected render(): unknown {
    return html`${unsafeHTML(this._isFullScreen ? Minimize2 : Maximize2)}`;
  }
}
