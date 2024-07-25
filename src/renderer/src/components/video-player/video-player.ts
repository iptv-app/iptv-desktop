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
import { FILTER_TYPE, IPTVChannelWithStream, IPTVStream } from '../../../../preload/iptv.type';
import '../channel-list';
import { dispatchEvent, ECustomEvent } from '../../utils/event';
import '../form/app-button';
import './volume-control';
import './fullscreen-button';
import './caption-button';
import './quality-button';
import '../layout/spinner-loading';
import './player-error';
import Hls, { ErrorDetails, Events, Level, MediaPlaylist } from 'hls.js';
import { channelName } from '../../utils/channel';

@customElement('video-player')
export class VideoPlayer extends LitElement {
  @property()
  filter?: FILTER_TYPE;

  @property()
  code?: string;

  private _channelId;
  @property()
  set channelId(val) {
    this._loadData(val);
    this._channelId = val;
  }
  get channelId() {
    return this._channelId;
  }

  @state()
  _data?: IPTVChannelWithStream;

  @state()
  _streamList: IPTVStream[] = [];

  @state()
  _isMouseOverControl = false;

  @state()
  _isControlVisible = true;

  @state()
  _isBuffering = false;

  @state()
  error?: Error;

  @state()
  _isPlaying = false;

  @state()
  _volume = 1;

  @state()
  _isMuted = false;

  @state()
  _isPip = false;

  @state()
  _captionList: MediaPlaylist[] = [];

  @state()
  _activeCaptionIdx: number = -1;

  @state()
  _qualityList: Level[] = [];

  @state()
  _activeQualityIdx: number = -1;

  private static _video = document.createElement('video');
  private static _caption = document.createElement('div');
  private static _track = VideoPlayer._video.addTextTrack('captions');
  private _hls = new Hls({
    renderTextTracksNatively: false,
    subtitlePreference: {
      default: false
    },
    enableCEA708Captions: window.__appConfig?.caption?.isEnableCEA708
  });

  constructor() {
    super();
    VideoPlayer._video.autoplay = true;
    this._hls.attachMedia(VideoPlayer._video);
    this._hls.on(Events.ERROR, (_e, data) => {
      if (data.details === ErrorDetails.BUFFER_STALLED_ERROR) {
        this._isBuffering = true;
      } else {
        this._isBuffering = false;
        this.error = data.error;
      }
    });
    this._hls.on(Events.FRAG_BUFFERED, () => {
      this.error = undefined;
      this._isBuffering = false;
    });

    this._hls.on(Events.MANIFEST_PARSED, (_e, data) => {
      this._qualityList = data.levels;
      this._captionList = data.subtitleTracks;
    });

    this._hls.on(Events.LEVELS_UPDATED, (_e, data) => {
      this._qualityList = data.levels;
    });

    this._hls.on(Events.SUBTITLE_TRACKS_UPDATED, (_e, data) => {
      this._captionList = data.subtitleTracks;
      if (window.__appConfig?.caption?.isAutoShow) {
        if (this._captionList.length > 0) {
          this._changeCaption(this._captionList[0].id);
        }
      } else {
        this._changeCaption(-1);
      }
    });
    this._hls.on(Events.SUBTITLE_TRACK_SWITCH, (_e, data) => {
      VideoPlayer._caption.innerHTML = '';
      this._activeCaptionIdx = data.id;
    });

    VideoPlayer._track.mode = 'hidden';
    this._hls.on(Events.CUES_PARSED, (_e, data) => {
      for (const item of data.cues) {
        const cue = item as VTTCue;

        cue.onenter = () => {
          const content = cue.text;
          const el = document.createElement('div');
          el.setAttribute('data-caption-id', cue.id);
          const span = document.createElement('span');
          span.innerText = content;
          el.appendChild(span);

          VideoPlayer._caption.appendChild(el);
        };
        cue.onexit = () => {
          const el = this.shadowRoot!.querySelector('[data-caption-id="' + cue.id + '"]');
          if (el) {
            VideoPlayer._caption.removeChild(el);
          }
        };
        VideoPlayer._track.addCue(cue);
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.onmousemove = this._detectControlAndIdle;
    this.onmousedown = this._detectControlAndIdle;
    this.ontouchstart = this._detectControlAndIdle;
    this.onclick = this._detectControlAndIdle;
    this.onkeydown = this._detectControlAndIdle;
    this._detectControlAndIdle();

    if (localStorage.getItem('volume')) {
      VideoPlayer._video.volume = Number(localStorage.getItem('volume'));
    }
    if (localStorage.getItem('isMuted')) {
      VideoPlayer._video.muted = localStorage.getItem('isMuted') === '1' ? true : false;
    }
    VideoPlayer._video.onplay = () => (this._isPlaying = true);
    VideoPlayer._video.onpause = () => (this._isPlaying = false);
    VideoPlayer._video.onended = () => (this._isPlaying = false);
    VideoPlayer._video.onleavepictureinpicture = this._updatePip;
    VideoPlayer._video.onenterpictureinpicture = this._updatePip;

    VideoPlayer._video.onvolumechange = () => {
      this._volume = VideoPlayer._video.volume;
      this._isMuted = VideoPlayer._video.muted;
    };
    this._volume = VideoPlayer._video.volume;
    this._isMuted = VideoPlayer._video.muted;
  }

  disconnectedCallback(): void {
    VideoPlayer._caption.innerHTML = '';
    this._hls?.destroy();

    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }

  private _loadData = async (channelId: string) => {
    if (channelId) {
      const channel = await window.api.getSingleChannelWithStream(channelId);
      this._data = channel;
      this._streamList = channel.streams;
      this._loadStream(0);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: channelName(channel),
        artist: channel.network || channel.owners.join(', ') || 'IPTV Desktop',
        artwork: [
          {
            src: channel.logo
          }
        ]
      });
      navigator.mediaSession.setActionHandler('previoustrack', () =>
        dispatchEvent(ECustomEvent.prevChannel)
      );
      navigator.mediaSession.setActionHandler('nexttrack', () =>
        dispatchEvent(ECustomEvent.nextChannel)
      );
    }
  };

  private _loadStream = (index: number) => {
    const stream = this._streamList?.[index];
    if (!stream) return;

    VideoPlayer._caption.innerHTML = '';

    var videoSrc = stream.url;
    this._hls.config.xhrSetup = (xhr, _url) => {
      if (stream.http_referrer) {
        xhr.setRequestHeader('X-Custom-Referer', stream.http_referrer);
      }
      if (stream.user_agent) {
        xhr.setRequestHeader('X-Custom-User-Agent', stream.user_agent);
      }
    };
    this.error = undefined;
    this._isBuffering = true;
    this._hls.loadSource(videoSrc);
  };

  private _handlePlay = () => {
    if (this._isPlaying) {
      VideoPlayer._video.pause();
    } else {
      VideoPlayer._video.play();
    }
  };

  private _handleChangeVolume = (e: CustomEvent) => {
    VideoPlayer._video.volume = e.detail.volume;
    localStorage.setItem('volume', e.detail.volume);
  };

  private _toggleMuted = () => {
    let newVal = !this._isMuted;
    VideoPlayer._video.muted = newVal;
    localStorage.setItem('isMuted', newVal ? '1' : '0');
  };

  private _togglePip = async () => {
    if (!document.pictureInPictureElement) {
      if (document.pictureInPictureEnabled) {
        VideoPlayer._video.requestPictureInPicture();
      }
    } else {
      await document.exitFullscreen();
    }
  };
  private _updatePip = async () => {
    const isPip = document.pictureInPictureElement !== null;
    this._isPip = isPip;
  };

  private _changeCaption = (idx: number) => {
    if (idx === -1) {
      this._hls.subtitleDisplay = false;
    } else {
      this._hls.subtitleDisplay = true;
    }
    this._hls.subtitleTrack = idx;
  };

  private _changeQuality = (idx: number) => {
    this._activeQualityIdx = idx;
    this._hls.currentLevel = idx;
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

  static styles = css`
    :host {
      height: 100vh;
      width: 100vw;
      background-color: ${THEME.BG_COLOR};
      color: ${THEME.FG_COLOR};
      display: block;
      position: relative;
      overflow: hidden;
    }
    #titlebar {
      position: fixed;
      height: env(titlebar-area-height, 30px);
      -webkit-app-region: drag;
      top: 0;
      left: 0;
      right: 0;
    }
    #video-container {
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    #video-container video {
      height: 100%;
      width: 100%;
      object-fit: contain;
      box-sizing: border-box;
    }
    spinner-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    spinner-loading.hidden {
      display: none;
    }
    #control-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: block;
    }
    #control-container:not(.visible) {
      cursor: none;
    }
    aside {
      padding-top: env(titlebar-area-height, 30px);
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
    .captions {
      position: absolute;
      bottom: 20%;
      left: 20%;
      right: 20%;
      top: 20%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-direction: row;
      text-align: center;
    }
    .captions span {
      background-color: ${THEME.BG_COLOR_TRANS};
      padding: 5px;
      font-size: 2vw;
      line-height: 1.5;
    }
  `;

  protected render(): unknown {
    const _visibleClass = this._isControlVisible || this._isMouseOverControl ? 'visible' : '';

    return html`<div id="video-container">
        <div id="titlebar"></div>
        ${VideoPlayer._video}
        <player-error
          .details=${this.error}
          class=${this.error === undefined ? 'hidden' : undefined}
        ></player-error>
        <spinner-loading class="${this._isBuffering ? 'show' : 'hidden'}"></spinner-loading>
        <div class="captions"><div>${VideoPlayer._caption}</div></div>
      </div>
      <div id="control-container" class="${_visibleClass}">
        <aside>
          <channel-list
            class="vertical with-titlebar"
            activeChannelId="${this._channelId}"
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
            <caption-button
              .captions=${this._captionList}
              .activeIdx=${this._activeCaptionIdx}
              @change=${(e: CustomEvent) => this._changeCaption(e.detail)}
            ></caption-button>
            <quality-button
              .qualities=${this._qualityList}
              .activeIdx=${this._activeQualityIdx}
              @change=${(e: CustomEvent) => this._changeQuality(e.detail)}
            ></quality-button>
            <app-button @click=${this._togglePip} class="icon"
              >${unsafeHTML(this._isPip ? PictureInPicture2 : PictureInPicture)}</app-button
            >
            <fullscreen-button></fullscreen-button>
          </div>
        </footer>
      </div>`;
  }
}
