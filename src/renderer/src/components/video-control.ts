import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, THEME } from '../assets/theme';
import { IPTVChannelWithStream } from '../../../preload/iptv.type';
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  Pause,
  Play
} from 'lucide-static';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

@customElement('video-control')
export class VideoControl extends LitElement {
  @property({ attribute: false })
  channel?: IPTVChannelWithStream;

  @property()
  backUrl?: string;

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
  _isPlaying = false;

  @state()
  _isFullScreen = false;

  constructor() {
    super();
    this._updateFullScreenState();
  }

  private _listenVideo = (vid: HTMLMediaElement) => {
    vid.onplay = () => (this._isPlaying = true);
    vid.onpause = () => (this._isPlaying = false);
    vid.onended = () => (this._isPlaying = false);
  };

  private _handlePlay = () => {
    if (this._isPlaying) {
      this.video?.pause();
    } else {
      this.video?.play();
    }
  };

  private _updateFullScreenState = () => {
    this._isFullScreen = document.fullscreenElement !== null;
  };
  private _toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    this._updateFullScreenState();
  };

  static styles = css`
    :host header {
      position: absolute;
      top: 20px;
      left: 20px;
    }
    :host .back-btn {
      background-color: ${THEME.BG_COLOR_TRANS};
      display: inline-flex;
      align-items: center;
      border-radius: 10px;
      color: ${THEME.PRIMARY_COLOR};
      padding: 5px 10px;
      text-decoration: none;
      border: 2px solid ${THEME.BG_SECONDARY_COLOR};
    }
    :host .back-btn:focus {
      ${INPUT_FOCUS_STYLE}
    }
    :host footer {
      display: grid;
      grid-template-columns: 500px minmax(0, 100fr) 500px;
      align-items: center;
      gap: 20px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, ${THEME.BG_COLOR_TRANS}, transparent);
      padding: 80px 40px 40px 40px;
      box-sizing: border-box;
    }
    :host figure {
      width: 150px;
      height: 50px;
      margin: 0;
      background-color: ${THEME.CHANNEL_BG_COLOR};
      padding: 20px;
      border-radius: 10px;
    }
    :host figure img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    :host h1 {
      margin: 0;
    }
    .channel {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .channel-meta {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .main-control {
      justify-content: center;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    button {
      background-color: ${THEME.BG_COLOR_TRANS};
      border: 2px solid ${THEME.BG_SECONDARY_COLOR};
      color: ${THEME.PRIMARY_COLOR};
      border-radius: 50%;
      height: 50px;
      width: 50px;
      cursor: pointer;
    }
    button.center-control {
      height: 70px;
      width: 70px;
    }
    button.center-control svg {
      height: 50px;
    }
    button:focus {
      ${INPUT_FOCUS_STYLE}
    }
    .right-control {
      text-align: right;
    }
    .right-control button {
      border-radius: 10px;
    }
  `;

  protected render(): unknown {
    return html` <header>
        <a class="back-btn" href="${this.backUrl}"> ${unsafeHTML(ArrowLeft)} Back </a>
      </header>
      <footer>
        <div class="channel">
          <figure>
            <img
              onerror="this.src='/assets/logo-placeholder.png'"
              src="${this.channel?.logo}"
              alt=""
            />
          </figure>
          <div class="channel-meta">
            <h1>${this.channel?.alt_names[0] ?? this.channel?.name}</h1>
            <div>${this.channel?.owners.join(', ')}</div>
          </div>
        </div>
        <div class="main-control">
          <button>${unsafeHTML(ChevronsLeft)}</button>
          <button class="center-control" @click=${this._handlePlay}>
            ${unsafeHTML(this._isPlaying ? Pause : Play)}
          </button>
          <button>${unsafeHTML(ChevronsRight)}</button>
        </div>
        <div class="right-control">
          <button @click=${this._toggleFullScreen}>
            ${unsafeHTML(this._isFullScreen ? Minimize2 : Maximize2)}
          </button>
        </div>
      </footer>`;
  }
}
