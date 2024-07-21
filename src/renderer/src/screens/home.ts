import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/filter-list';
import { SCROLLBAR_STYLE, THEME } from '../assets/theme';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import '../components/channel-list';
import { navigate } from '../utils/routing';

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
      :host filter-list {
        width: 300px;
        height: 100vh;
        overflow-y: scroll;
        border-right: 1px solid ${THEME.BG_SECONDARY_COLOR};
      }
      :host channel-list {
        flex: 1;
        height: 100vh;
        overflow-y: scroll;
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
      <channel-list filter="${this.filter}" code="${this.code}"></channel-list>`;
  }
}
