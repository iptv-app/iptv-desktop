import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { THEME } from '../assets/theme';
import { FILTER_TYPE, IPTVChannelWithStream, IPTVStream } from '../../../preload/iptv.type';
import Hls from 'hls.js';
import '../components/video-control';

@customElement('watch-screen')
export class WatchScreen extends LitElement {
  @property()
  filter?: FILTER_TYPE;

  @property()
  code?: string;

  private _channelId;
  @property()
  set channel(val) {
    this._loadData(val);
    this._channelId = val;
  }
  get channel() {
    return this._channelId;
  }

  @state()
  _data?: IPTVChannelWithStream;

  private _loadData = async (channelId: string) => {
    if (channelId) {
      const channel = await window.api.getSingleChannelWithStream(channelId);
      this._data = channel;
      if (channel.streams[0]) {
        this._loadStream(channel.streams[0]);
      }
    }
  };

  private static _video = document.createElement('video');

  private _loadStream = (stream: IPTVStream) => {
    var videoSrc = stream.url;
    if (Hls.isSupported()) {
      var hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(WatchScreen._video);
    } else if (WatchScreen._video.canPlayType('application/vnd.apple.mpegurl')) {
      WatchScreen._video.src = videoSrc;
    }
    WatchScreen._video.play();
  };
  static styles = css`
    :host {
      height: 100vh;
      width: 100vw;
      background-color: ${THEME.BG_COLOR};
      color: ${THEME.FG_COLOR};
      display: block;
      position: relative;
    }
    :host #video-container {
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    :host #video-container video {
      height: 100%;
      width: 100%;
      object-fit: contain;
      box-sizing: border-box;
    }
  `;
  protected render(): unknown {
    return html`<div id="video-container">${WatchScreen._video}</div>
      <video-control
        .channel=${this._data}
        .backUrl="${`#home/${this.filter}/${this.code}`}"
        .video=${WatchScreen._video}
      ></video-control>`;
  }
}
