import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { THEME } from '../../assets/theme';
import {
  ChevronsLeft,
  ChevronsRight,
  Pause,
  PictureInPicture,
  PictureInPicture2,
  Play
} from 'lucide-static';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { FILTER_TYPE } from '../../../../preload/iptv.type';
import '../channel-list';
import { dispatchEvent, ECustomEvent } from '../../utils/event';
import '../form/app-button';
import './volume-control';
import './fullscreen-button';

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
  _volume = 1;

  @state()
  _isMuted = false;

  @state()
  _isPip = false;

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
    // @ts-expect-error
    vid.onleavepictureinpicture = this._updatePip;
    // @ts-expect-error
    vid.onenterpictureinpicture = this._updatePip;

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

  private _handleChangeVolume = (e: CustomEvent) => {
    this._video!.volume = e.detail.volume;
    localStorage.setItem('volume', e.detail.volume);
  };

  private _toggleMuted = () => {
    let newVal = !this._isMuted;
    this._video!.muted = newVal;
    localStorage.setItem('isMuted', newVal ? '1' : '0');
  };

  private _togglePip = async () => {
    if (!document.pictureInPictureElement) {
      if (document.pictureInPictureEnabled) {
        // @ts-expect-error
        this._video.requestPictureInPicture();
      }
    } else {
      await document.exitFullscreen();
    }
  };
  private _updatePip = async () => {
    const isPip = document.pictureInPictureElement !== null;
    this._isPip = isPip;
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
    .right-control {
      display: flex;
      gap: 5px;
      align-items: center;
      justify-content: flex-end;
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
          <app-button class="circle icon" @click=${() => dispatchEvent(ECustomEvent.prevChannel)}>
            ${unsafeHTML(ChevronsLeft)}
          </app-button>
          <app-button class="circle icon lg" @click=${this._handlePlay}>
            ${unsafeHTML(this._isPlaying ? Pause : Play)}
          </app-button>
          <app-button class="circle icon" @click=${() => dispatchEvent(ECustomEvent.nextChannel)}>
            ${unsafeHTML(ChevronsRight)}
          </app-button>
        </div>
        <div class="right-control">
          <volume-control
            @volumeChange=${this._handleChangeVolume}
            @toggleMuted=${this._toggleMuted}
            volume=${this._volume}
            ?isMuted=${this._isMuted}
          ></volume-control>
          <app-button @click=${this._togglePip} class="icon"
            >${unsafeHTML(this._isPip ? PictureInPicture2 : PictureInPicture)}</app-button
          >
          <fullscreen-button></fullscreen-button>
        </div>
      </footer>
    </div>`;
  }
}
