import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, THEME } from '../assets/theme';
import {
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX
} from 'lucide-static';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import './channel-list';
import { dispatchEvent, ECustomEvent } from '../utils/event';

@customElement('video-control')
export class VideoControl extends LitElement {
  @property()
  filter?: FILTER_TYPE;

  @property()
  code?: string;

  @property()
  channelId?: string;

  private _video?: HTMLMediaElement;
  @property()
  set video(val) {
    if (val) {
      this._listenVideo(val);
    }
    this._video = val;
  }
  get video() {
    return this._video;
  }

  @state()
  _isMouseOverControl = false;

  @state()
  _isControlVisible = true;

  @state()
  _isPlaying = false;

  @state()
  _isFullScreen = false;

  @state()
  _volume = 1;

  @state()
  _isMuted = false;

  constructor() {
    super();
    this._updateFullScreenState();
  }

  private _listenVideo = (vid: HTMLMediaElement) => {
    if (localStorage.getItem('volume')) {
      vid.volume = Number(localStorage.getItem('volume'));
    }
    if (localStorage.getItem('isMuted')) {
      vid.muted = localStorage.getItem('isMuted') === '1' ? true : false;
    }
    vid.onplay = () => (this._isPlaying = true);
    vid.onpause = () => (this._isPlaying = false);
    vid.onended = () => (this._isPlaying = false);

    vid.onvolumechange = () => {
      this._volume = vid.volume;
      this._isMuted = vid.muted;
    };
    this._volume = vid.volume;
    this._isMuted = vid.muted;
  };

  private _handlePlay = () => {
    if (this._isPlaying) {
      this.video?.pause();
    } else {
      this.video?.play();
    }
  };

  private _handleChangeVolume = (e) => {
    this._video!.volume = Number(e.target.value);
    localStorage.setItem('volume', e.target.value);
  };

  private _toggleMuted = () => {
    let newVal = !this._isMuted;
    this._video!.muted = newVal;
    localStorage.setItem('isMuted', newVal ? '1' : '0');
  };

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

  private _idleTimeout?: NodeJS.Timeout;
  private _resetIdleTimeout = () => {
    if (!this._isControlVisible) {
      this._isControlVisible = true;
    }
    if (this._idleTimeout) {
      clearTimeout(this._idleTimeout);
    }
    this._idleTimeout = setTimeout(() => {
      this._isControlVisible = false;
    }, 3000);
  };

  private _detectControlAndIdle = () => {
    this._resetIdleTimeout();
    const ctrl = this.shadowRoot!.querySelector('footer');
    const sidebar = this.shadowRoot!.querySelector('aside');
    if (ctrl?.matches(':hover') || sidebar?.matches(':hover')) {
      this._isMouseOverControl = true;
    } else {
      this._isMouseOverControl = false;
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.onmousemove = this._detectControlAndIdle;
    this.onmousedown = this._detectControlAndIdle;
    this.ontouchstart = this._detectControlAndIdle;
    this.onclick = this._detectControlAndIdle;
    this.onkeydown = this._detectControlAndIdle;
    this._detectControlAndIdle();
  }

  static styles = css`
    .container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: block;
    }
    .container:not(.visible) {
      cursor: none;
    }
    aside {
      position: absolute;
      top: 0;
      left: -450px;
      bottom: 0;
      overflow-y: auto;
      width: 400px;
      background: linear-gradient(
        to right,
        ${THEME.BG_COLOR_TRANS_STRONG},
        ${THEME.BG_COLOR_TRANS},
        transparent
      );
      z-index: 2;
      padding-right: 50px;
      transition:
        left 1s ease,
        opacity 0.5s ease;
      opacity: 0;
    }
    .visible aside {
      left: 0;
      opacity: 1;
    }
    footer {
      position: absolute;
      bottom: -200px;
      left: 0;
      right: 0;
      background: linear-gradient(to top, ${THEME.BG_COLOR_TRANS}, transparent);
      padding: 80px 40px 40px 40px;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 400px minmax(0, 100fr) 400px;
      align-items: center;
      gap: 20px;
      transition:
        bottom 1s ease,
        opacity 0.5s ease;
      opacity: 0;
    }
    .visible footer {
      bottom: 0px;
      opacity: 1;
    }
    .main-control {
      justify-content: center;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .control {
      background-color: ${THEME.BG_COLOR_TRANS};
      border: 2px solid ${THEME.BG_SECONDARY_COLOR};
      color: ${THEME.PRIMARY_COLOR};
      border-radius: 50%;
      height: 50px;
      width: 50px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .control.center-control {
      height: 70px;
      width: 70px;
    }
    .control.center-control svg {
      height: 50px;
    }
    .control:focus {
      ${INPUT_FOCUS_STYLE}
    }
    .right-control {
      display: flex;
      gap: 5px;
      align-items: center;
      justify-content: flex-end;
    }
    .right-control .control {
      border-radius: 10px;
    }
    .control.volume {
      width: auto;
      padding-left: 10px;
      padding-right: 10px;
      cursor: default;
      display: flex;
      gap: 5px;
    }
    .control.volume button {
      background-color: transparent;
      color: ${THEME.PRIMARY_COLOR};
      padding: 0;
      cursor: pointer;
      border: none;
    }
    .control.volume input {
      width: 100px;
      accent-color: ${THEME.PRIMARY_COLOR};
    }
  `;

  protected render(): unknown {
    const _visibleClass = this._isControlVisible || this._isMouseOverControl ? 'visible' : '';

    return html`<div class="container ${_visibleClass}">
      <aside>
        <channel-list
          class="vertical with-titlebar"
          activeChannelId="${this.channelId}"
          isShowBack="1"
          isVertical="1"
          filter="${this.filter}"
          code="${this.code}"
        ></channel-list>
      </aside>
      <footer>
        <div></div>
        <div class="main-control">
          <button class="control" @click=${() => dispatchEvent(ECustomEvent.prevChannel)}>
            ${unsafeHTML(ChevronsLeft)}
          </button>
          <button class="control center-control" @click=${this._handlePlay}>
            ${unsafeHTML(this._isPlaying ? Pause : Play)}
          </button>
          <button class="control" @click=${() => dispatchEvent(ECustomEvent.nextChannel)}>
            ${unsafeHTML(ChevronsRight)}
          </button>
        </div>
        <div class="right-control">
          <div class="control volume">
            <button @click=${this._toggleMuted}>
              ${unsafeHTML(this._isMuted ? VolumeX : Volume2)}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              @input=${this._handleChangeVolume}
              .value=${this._volume}
            />
          </div>
          <button class="control" @click=${this._toggleFullScreen}>
            ${unsafeHTML(this._isFullScreen ? Minimize2 : Maximize2)}
          </button>
        </div>
      </footer>
    </div>`;
  }
}
