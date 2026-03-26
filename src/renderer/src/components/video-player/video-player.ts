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
import './select-button';
import '../layout/spinner-loading';
import './player-error';
import Hls, { ErrorDetails, Events, Level, MediaPlaylist } from 'hls.js';
import { channelName } from '../../utils/channel';
import '../layout/app-titlebar';
import { SelectButtonOption } from './select-button';

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
  _isControlVisible = true;

  @state()
  _isBuffering = false;

  @state()
  error?: Error;

  @state()
  _errorReason?: string;

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

  @state()
  _activeStreamIdx: number = 0;

  @state()
  _timeshiftOffset = 0;

  @state()
  _bufferDuration = 0;

  @state()
  _isAtLive = true;

  private static _video = document.createElement('video');
  private static _caption = document.createElement('div');
  private static _track = VideoPlayer._video.addTextTrack('captions');
  private static _streamPrefStorageKey = 'streamPrefByChannel';
  private _startupTimeout?: NodeJS.Timeout;
  private _isStreamStarted = false;
  private _autoTriedStreams = new Set<number>();
  private _mediaRecoveryAttempt = 0;
  private _networkRecoveryAttempt = 0;
  private _stalledCount = 0;
  private _rafId?: number;
  private _timeshiftEnabled = !!(window.__appConfig?.timeshift?.isEnabled);
  private _hls = new Hls({
    renderTextTracksNatively: false,
    subtitlePreference: {
      default: false
    },
    enableCEA708Captions: window.__appConfig?.caption?.isEnableCEA708,
    backBufferLength: window.__appConfig?.timeshift?.isEnabled
      ? (window.__appConfig?.timeshift?.bufferMinutes ?? 30) * 60
      : 30,
    maxBufferLength: 20,
    capLevelToPlayerSize: true,
    startLevel: -1
  });

  constructor() {
    super();
    VideoPlayer._video.autoplay = true;
    this._hls.attachMedia(VideoPlayer._video);
    this._hls.on(Events.ERROR, (_e, data) => {
      if (data.details === ErrorDetails.BUFFER_STALLED_ERROR) {
        this._isBuffering = true;
        this._stalledCount += 1;
        this._downshiftQuality();
        if (this._stalledCount >= 3 && this._streamList.length > 1) {
          if (!this._tryNextStream()) {
            this._setPlaybackError('Stream stalled repeatedly and no other URL is available.');
          }
        }
      } else {
        this._isBuffering = false;
      }

      if (!data.fatal) return;

      const details = `${data.details || ''}`.toLowerCase();
      const isCodecIssue = details.includes('codec');

      if (data.type === 'networkError') {
        if (this._networkRecoveryAttempt === 0) {
          this._networkRecoveryAttempt += 1;
          this._hls.startLoad();
          this.error = data.error;
          this._errorReason = 'Network issue detected. Retrying current stream...';
          return;
        }
        if (!this._tryNextStream()) {
          this._setPlaybackError(
            'Network error while loading stream. Check connection or retry.',
            data.error
          );
        }
        return;
      }

      if (isCodecIssue) {
        if (!this._tryNextStream()) {
          this._setPlaybackError(
            'Unsupported codec for current device. Try retry or another stream.',
            data.error
          );
        }
        return;
      }

      if (data.type === 'mediaError') {
        if (this._mediaRecoveryAttempt === 0) {
          this._mediaRecoveryAttempt += 1;
          this._hls.recoverMediaError();
          this.error = undefined;
          return;
        }
        if (this._mediaRecoveryAttempt === 1) {
          this._mediaRecoveryAttempt += 1;
          this._hls.swapAudioCodec();
          this._hls.recoverMediaError();
          this.error = undefined;
          return;
        }
        if (!this._tryNextStream()) {
          this._setPlaybackError(
            'Decoder failed to recover from media error. Try retry or fallback stream.',
            data.error
          );
        }
        return;
      }

      this._setPlaybackError('Stream playback failed. Try retry or fallback stream.', data.error);
    });
    this._hls.on(Events.FRAG_BUFFERED, () => {
      this._isStreamStarted = true;
      this._clearStartupTimeout();
      this.error = undefined;
      this._errorReason = undefined;
      this._isBuffering = false;
    });

    this._hls.on(Events.MANIFEST_PARSED, (_e, data) => {
      this._qualityList = data.levels;
      this._captionList = data.subtitleTracks;
      this._applyDecoderSafeCap();
    });

    this._hls.on(Events.LEVELS_UPDATED, (_e, data) => {
      this._qualityList = data.levels;
      this._applyDecoderSafeCap();
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
    this.onmousemove = this._showControlAndResetIdle;
    this.onmousedown = this._showControlAndResetIdle;
    this.ontouchstart = this._showControlAndResetIdle;
    this.onclick = this._showControlAndResetIdle;
    this.onkeydown = this._showControlAndResetIdle;
    this.onwheel = this._showControlAndResetIdle;
    window.addEventListener('blur', this._hideControl);
    window.addEventListener('focus', this._showControlAndResetIdle);
    window.addEventListener('keydown', this._handleGlobalShortcut);
    this._showControlAndResetIdle();

    if (localStorage.getItem('volume')) {
      VideoPlayer._video.volume = Number(localStorage.getItem('volume'));
    }
    if (localStorage.getItem('isMuted')) {
      VideoPlayer._video.muted = localStorage.getItem('isMuted') === '1' ? true : false;
    }
    VideoPlayer._video.onplay = () => (this._isPlaying = true);
    VideoPlayer._video.onplaying = () => {
      this._isPlaying = true;
      this._isStreamStarted = true;
      this._clearStartupTimeout();
      this.error = undefined;
      this._errorReason = undefined;
      this._saveCurrentStreamPreference();
    };
    VideoPlayer._video.onpause = () => (this._isPlaying = false);
    VideoPlayer._video.onended = () => {
      this._isPlaying = false;
      this._isStreamStarted = false;
      if (this._streamList.length > 1 && !this._rotateToNextStream()) {
        this._setPlaybackError('Current stream stopped and no other URL is available.');
      }
    };
    VideoPlayer._video.onleavepictureinpicture = this._updatePip;
    VideoPlayer._video.onenterpictureinpicture = this._updatePip;

    VideoPlayer._video.onvolumechange = () => {
      this._volume = VideoPlayer._video.volume;
      this._isMuted = VideoPlayer._video.muted;
    };
    this._volume = VideoPlayer._video.volume;
    this._isMuted = VideoPlayer._video.muted;
    this._startTimeshiftLoop();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopTimeshiftLoop();
    window.removeEventListener('blur', this._hideControl);
    window.removeEventListener('focus', this._showControlAndResetIdle);
    window.removeEventListener('keydown', this._handleGlobalShortcut);

    VideoPlayer._caption.innerHTML = '';
    this._clearStartupTimeout();
    this._hls?.destroy();

    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', null);
  }

  private _formatDuration = (secs: number): string => {
    const totalSecs = Math.floor(Math.abs(secs));
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  private _startTimeshiftLoop = () => {
    if (!this._timeshiftEnabled) return;
    const update = () => {
      const video = VideoPlayer._video;
      if (video.buffered.length > 0) {
        const liveEdge = video.buffered.end(video.buffered.length - 1);
        const bufferStart = video.buffered.start(0);
        this._bufferDuration = Math.max(0, liveEdge - bufferStart);
        this._timeshiftOffset = Math.max(0, liveEdge - video.currentTime);
        this._isAtLive = this._timeshiftOffset < 6; // 6 second grace period for 'Live'
      }
      this._rafId = requestAnimationFrame(update);
    };
    this._rafId = requestAnimationFrame(update);
  };

  private _stopTimeshiftLoop = () => {
    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
  };

  private _seekToPosition = (posInBuffer: number) => {
    const video = VideoPlayer._video;
    if (video.buffered.length === 0) return;
    const liveEdge = video.buffered.end(video.buffered.length - 1);
    const bufferStart = video.buffered.start(0);
    video.currentTime = Math.min(Math.max(bufferStart + posInBuffer, bufferStart), liveEdge);
  };

  private _seekRelative = (deltaSecs: number) => {
    if (!this._timeshiftEnabled) return;
    const video = VideoPlayer._video;
    if (video.buffered.length === 0) return;
    const liveEdge = video.buffered.end(video.buffered.length - 1);
    const bufferStart = video.buffered.start(0);
    video.currentTime = Math.min(Math.max(video.currentTime + deltaSecs, bufferStart), liveEdge);
  };

  private _goLive = () => {
    const video = VideoPlayer._video;
    if (video.buffered.length === 0) return;
    const liveEdge = video.buffered.end(video.buffered.length - 1);
    video.currentTime = liveEdge;
    if (!this._isPlaying) video.play();
  };

  private _onTimeshiftSeek = (e: Event) => {
    const val = Number((e.target as HTMLInputElement).value);
    this._seekToPosition(val);
  };

  private _loadData = async (channelId: string) => {
    if (channelId) {
      const channel = await window.api.getSingleChannelWithStream(channelId);
      this._data = channel;
      this._streamList = channel.streams;
      const preferredIdx = this._getPreferredStreamIndex(channelId, channel.streams);
      this._activeStreamIdx = preferredIdx;
      this._startStreamSequence(preferredIdx);
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
      navigator.mediaSession.setActionHandler('play', () => VideoPlayer._video.play());
      navigator.mediaSession.setActionHandler('pause', () => VideoPlayer._video.pause());
      navigator.mediaSession.setActionHandler('stop', () => VideoPlayer._video.pause());
    }
  };

  private _loadStream = (index: number) => {
    const stream = this._streamList?.[index];
    if (!stream) return;
    this._activeStreamIdx = index;
    this._autoTriedStreams.add(index);
    this._isStreamStarted = false;
    this._clearStartupTimeout();
    this._mediaRecoveryAttempt = 0;
    this._networkRecoveryAttempt = 0;
    this._stalledCount = 0;
    this._activeQualityIdx = -1;
    this._qualityList = [];

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
    this._errorReason = undefined;
    this._isBuffering = true;
    this._hls.loadSource(videoSrc);
    this._startupTimeout = setTimeout(() => {
      if (this._isStreamStarted) return;
      if (!this._tryNextStream()) {
        this._setPlaybackError('Stream did not start. All available URLs were tried.');
      }
    }, 12000);
  };

  private _getPreferredStreamIndex = (channelId: string, streams: IPTVStream[]) => {
    if (streams.length === 0) return 0;
    try {
      const raw = localStorage.getItem(VideoPlayer._streamPrefStorageKey);
      if (!raw) return 0;
      const pref = JSON.parse(raw) as Record<string, string>;
      const preferredUrl = pref[channelId];
      if (!preferredUrl) return 0;
      const idx = streams.findIndex((item) => item.url === preferredUrl);
      return idx > -1 ? idx : 0;
    } catch {
      return 0;
    }
  };

  private _saveCurrentStreamPreference = () => {
    if (!this._channelId) return;
    const currentStream = this._streamList[this._activeStreamIdx];
    if (!currentStream?.url) return;
    try {
      const raw = localStorage.getItem(VideoPlayer._streamPrefStorageKey);
      const pref = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      pref[this._channelId] = currentStream.url;
      localStorage.setItem(VideoPlayer._streamPrefStorageKey, JSON.stringify(pref));
    } catch {}
  };

  private _startStreamSequence = (index: number) => {
    this._autoTriedStreams.clear();
    this._loadStream(index);
  };

  private _clearStartupTimeout = () => {
    if (this._startupTimeout) {
      clearTimeout(this._startupTimeout);
      this._startupTimeout = undefined;
    }
  };

  private _setPlaybackError = (reason: string, error?: Error) => {
    if (this._tryNextStream()) {
      return;
    }
    this._clearStartupTimeout();
    this._isStreamStarted = false;
    this._errorReason = reason;
    this.error = error || new Error(reason);
    this._isBuffering = false;
  };

  private _tryNextStream = () => {
    if (this._streamList.length <= 1) return false;
    for (let offset = 1; offset <= this._streamList.length; offset++) {
      const nextIdx = (this._activeStreamIdx + offset) % this._streamList.length;
      if (!this._autoTriedStreams.has(nextIdx)) {
        this._loadStream(nextIdx);
        return true;
      }
    }
    return false;
  };

  private _rotateToNextStream = () => {
    if (this._streamList.length <= 1) return false;
    const nextIdx = (this._activeStreamIdx + 1) % this._streamList.length;
    this._startStreamSequence(nextIdx);
    return true;
  };

  private _retryPlayback = () => {
    if (!this._streamList.length) return;
    this._startStreamSequence(this._activeStreamIdx);
  };

  private _fallbackPlayback = () => {
    if (!this._tryNextStream()) {
      this._setPlaybackError('No fallback stream available.');
    }
  };

  private _streamLabel = (stream: IPTVStream, index: number) => {
    try {
      const parsed = new URL(stream.url);
      return `${index + 1}. ${parsed.hostname}`;
    } catch {
      return `${index + 1}. ${stream.url}`;
    }
  };

  private _streamOptions = () => {
    return this._streamList.map<SelectButtonOption>((stream, index) => ({
      label: this._streamLabel(stream, index),
      value: index
    }));
  };

  private _onChangeStream = (e: CustomEvent) => {
    const nextIdx = Number(e.detail);
    if (!Number.isNaN(nextIdx) && nextIdx !== this._activeStreamIdx) {
      this._startStreamSequence(nextIdx);
    }
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
      await document.exitPictureInPicture();
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
    this._stalledCount = 0;
    this._hls.currentLevel = idx;
  };

  private _applyDecoderSafeCap = () => {
    if (!this._qualityList.length) return;
    const cpuCount = navigator.hardwareConcurrency || 4;
    const maxHeight = cpuCount <= 4 ? 720 : cpuCount <= 8 ? 1080 : 2160;
    const maxBitrate = cpuCount <= 4 ? 3000000 : cpuCount <= 8 ? 7000000 : Number.MAX_SAFE_INTEGER;
    let safeLevel = -1;
    this._qualityList.forEach((level, idx) => {
      const height = level.height || 0;
      const bitrate = level.bitrate || 0;
      if (height <= maxHeight && bitrate <= maxBitrate) {
        safeLevel = idx;
      }
    });
    this._hls.autoLevelCapping = safeLevel;
  };

  private _downshiftQuality = () => {
    if (this._activeQualityIdx !== -1 || this._stalledCount < 2) return;
    const currentAutoLevel = this._hls.nextAutoLevel;
    if (currentAutoLevel > 0) {
      this._hls.nextLevel = currentAutoLevel - 1;
    }
  };

  private _isTypingTarget = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
    if (target.closest('text-input') || target.closest('search-input') || target.closest('select-item')) {
      return true;
    }
    return false;
  };

  private _toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  private _handleGlobalShortcut = async (event: KeyboardEvent) => {
    if (event.defaultPrevented || this._isTypingTarget(event)) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.repeat) return;

    switch (event.code) {
      case 'ArrowUp':
      case 'PageUp':
      case 'MediaTrackPrevious':
      case 'BrowserBack':
      case 'Backspace':
      case 'KeyJ':
        event.preventDefault();
        dispatchEvent(ECustomEvent.prevChannel);
        break;

      case 'ArrowDown':
      case 'PageDown':
      case 'MediaTrackNext':
      case 'KeyN':
      case 'KeyL':
        event.preventDefault();
        dispatchEvent(ECustomEvent.nextChannel);
        break;

      case 'Space':
      case 'MediaPlayPause':
      case 'KeyK':
        event.preventDefault();
        this._handlePlay();
        break;

      case 'KeyF':
        event.preventDefault();
        await this._toggleFullscreen();
        break;

      case 'KeyM':
        event.preventDefault();
        this._toggleMuted();
        break;

      case 'ArrowLeft':
        if (this._timeshiftEnabled) {
          event.preventDefault();
          this._seekRelative(-30);
        }
        break;

      case 'ArrowRight':
        if (this._timeshiftEnabled) {
          event.preventDefault();
          this._seekRelative(30);
        }
        break;

      case 'End':
        if (this._timeshiftEnabled) {
          event.preventDefault();
          this._goLive();
        }
        break;
    }
  };

  private _idleTimeout?: NodeJS.Timeout;

  private _hideControl = () => {
    this._isControlVisible = false;
  };

  private _showControlAndResetIdle = () => {
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
    .top-right-control {
      position: absolute;
      top: calc(env(titlebar-area-height, 30px) + 10px);
      right: 20px;
      z-index: 4;
      opacity: 0;
      transition: opacity 0.5s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .top-right-control .stream-label {
      max-width: 360px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 0.9rem;
      padding: 8px 10px;
      border-radius: 8px;
      background-color: ${THEME.BG_COLOR_TRANS};
      border: 1px solid ${THEME.BORDER_COLOR};
    }
    .visible .top-right-control {
      opacity: 1;
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
    .timeshift-bar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 0 10px 0;
    }
    .ts-time {
      min-width: 72px;
      text-align: right;
      font-size: 0.82rem;
      font-variant-numeric: tabular-nums;
      color: #c082ff;
      letter-spacing: 0.03em;
      font-weight: 600;
    }
    .ts-live {
      min-width: 64px;
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid #555577;
      background: transparent;
      color: #aaaacc;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: background 0.25s, color 0.25s, border-color 0.25s;
      white-space: nowrap;
    }
    .ts-live:hover {
      border-color: #c082ff;
      color: #c082ff;
    }
    .ts-live.is-live {
      background: #e53935;
      border-color: #e53935;
      color: #fff;
    }
    .ts-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      background: rgba(255,255,255,0.15);
      outline: none;
      cursor: pointer;
      transition: height 0.15s;
    }
    .ts-slider:hover {
      height: 6px;
    }
    .ts-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #c082ff;
      box-shadow: 0 0 6px #c082ff88;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .ts-slider::-webkit-slider-thumb:hover {
      transform: scale(1.35);
      box-shadow: 0 0 10px #c082ffbb;
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
    const _visibleClass = this._isControlVisible ? 'visible' : '';

    return html`<div id="video-container">
        <app-titlebar class="fixed no-border"></app-titlebar>
        ${VideoPlayer._video}
        <player-error
          .details=${this.error}
          .reason=${this._errorReason}
          .canFallback=${this._activeStreamIdx + 1 < this._streamList.length}
          .streamIndex=${this._activeStreamIdx}
          .streamCount=${this._streamList.length}
          @retry=${this._retryPlayback}
          @fallback=${this._fallbackPlayback}
          class=${this.error === undefined ? 'hidden' : undefined}
        ></player-error>
        <spinner-loading class="${this._isBuffering ? 'show' : 'hidden'}"></spinner-loading>
        <div class="captions"><div>${VideoPlayer._caption}</div></div>
      </div>
      <div id="control-container" class="${_visibleClass}">
        <div class="top-right-control">
          <div class="stream-label">
            ${this._streamList[this._activeStreamIdx]
              ? this._streamLabel(this._streamList[this._activeStreamIdx], this._activeStreamIdx)
              : 'No stream'}
          </div>
          <select-button
            class="${this._streamList.length <= 1 ? 'hidden' : ''}"
            .options=${this._streamOptions()}
            .value=${this._activeStreamIdx}
            placement="bottom"
            @change=${this._onChangeStream}
            >URL</select-button
          >
        </div>
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
          ${this._timeshiftEnabled ? html`
            <div class="timeshift-bar">
              <span class="ts-time" style="${this._isAtLive ? 'color: #ff4444;' : ''}">
                ${this._isAtLive ? 'LIVE' : '-' + this._formatDuration(this._timeshiftOffset)}
              </span>
              <input
                type="range"
                class="ts-slider"
                min="0"
                max="${Math.round(this._bufferDuration)}"
                step="1"
                .value="${String(Math.round(Math.max(0, this._bufferDuration - this._timeshiftOffset)))}"
                @input=${this._onTimeshiftSeek}
              />
              <button class="ts-live ${this._isAtLive ? 'is-live' : ''}" @click=${this._goLive}>● LIVE</button>
            </div>
          ` : ''}
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
