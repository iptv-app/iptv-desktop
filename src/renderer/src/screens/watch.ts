import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import '../components/video-player/video-player';

@customElement('watch-screen')
export class WatchScreen extends LitElement {
  @property()
  filter?: FILTER_TYPE;

  @property()
  code?: string;

  @property()
  channelId?: string;

  static styles = css``;
  protected render(): unknown {
    return html`<video-player
      channelId=${this.channelId}
      filter=${this.filter}
      code=${this.code}
    ></video-player>`;
  }
}
