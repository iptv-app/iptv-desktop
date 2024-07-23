import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/filter-list';
import { SCROLLBAR_STYLE, THEME } from '../assets/theme';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import '../components/channel-list';
import { navigate } from '../utils/routing';
import '../components/video-player/control-button';
import '../components/video-player/fullscreen-button';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Settings } from 'lucide-static';

@customElement('home-screen')
export class HomeScreen extends LitElement {
  @property()
  filter: FILTER_TYPE = 'country';

  @property()
  code?: string;

  private _onChangeFilter = (e: CustomEvent) => {
    const newFilter = e.detail.filter;
    if (newFilter !== this.filter) {
      navigate('home/' + newFilter);
      window.api.setIptvView(newFilter);
    }
  };

  private _onChangeCode = (e: CustomEvent) => {
    const newCode = e.detail.code;
    if (newCode !== this.code) {
      navigate('home/' + this.filter + '/' + newCode);
      window.api.setIptvView(this.filter, newCode);
    }
  };

  static styles = [
    SCROLLBAR_STYLE,
    css`
      :host {
        display: flex;
        gap: 10px;
        margin: 0;
        padding: 0;
        background-color: ${THEME.BG_COLOR};
        color: ${THEME.FG_COLOR};
      }
      filter-list {
        width: 300px;
        height: 100vh;
        overflow-y: scroll;
        border-right: 1px solid ${THEME.BG_SECONDARY_COLOR};
      }
      channel-list {
        flex: 1;
        height: 100vh;
        overflow-y: scroll;
      }
      .right-buttons {
        display: flex;
        align-items: flex-start;
        min-width: 0;
        gap: 5px;
      }
    `
  ];
  protected render(): unknown {
    return html`<filter-list
        filter="${this.filter}"
        @changeFilter="${this._onChangeFilter}"
        code="${this.code}"
        @changeCode="${this._onChangeCode}"
      ></filter-list>
      <channel-list filter="${this.filter}" code="${this.code}">
        <div class="right-buttons" slot="right-component">
          <control-button @click=${() => navigate('setting')}
            >${unsafeHTML(Settings)}</control-button
          >
          <fullscreen-button></fullscreen-button>
        </div>
      </channel-list>`;
  }
}
