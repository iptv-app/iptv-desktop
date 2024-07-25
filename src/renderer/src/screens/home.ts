import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/filter-list';
import { SCROLLBAR_STYLE, THEME } from '../assets/theme';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import '../components/channel-list';
import { navigate } from '../utils/routing';
import '../components/form/app-button';
import '../components/video-player/fullscreen-button';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Settings } from 'lucide-static';
import '../components/layout/with-titlebar';

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
        display: block;
        height: 100%;
      }
      #container {
        display: flex;
        gap: 10px;
        margin: 0;
        padding: 0;
        background-color: ${THEME.BG_COLOR};
        color: ${THEME.FG_COLOR};
        height: 100%;
      }
      filter-list {
        width: 300px;
        height: 100%;
        overflow-y: scroll;
        border-right: 1px solid ${THEME.BG_SECONDARY_COLOR};
      }
      channel-list {
        flex: 1;
        height: 100%;
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
    return html`<with-titlebar
      ><div id="container">
        <filter-list
          filter="${this.filter}"
          @changeFilter="${this._onChangeFilter}"
          code="${this.code}"
          @changeCode="${this._onChangeCode}"
        ></filter-list>
        <channel-list filter="${this.filter}" code="${this.code}">
          <div class="right-buttons" slot="right-component">
            <app-button class="icon" @click=${() => navigate('setting')}
              >${unsafeHTML(Settings)}</app-button
            >
            <fullscreen-button></fullscreen-button>
          </div>
        </channel-list></div
    ></with-titlebar>`;
  }
}
