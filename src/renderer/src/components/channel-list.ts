import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import { Task } from '@lit/task';
import './channel-item';
import { THEME } from '../assets/theme';
import { navigate } from '../utils/routing';
import { waitForElement } from '../utils/dom';
import { ECustomEvent } from '../utils/event';
import './layout/page-title';
import './form/search-input';
import './layout/spinner-loading';
import { channelName } from '../utils/channel';

@customElement('channel-list')
export class ChannelList extends LitElement {
  @property()
  filter?: FILTER_TYPE;

  @property()
  code?: string;

  @property()
  activeChannelId?: string;

  @property()
  isVertical?: boolean;

  @property()
  isShowBack?: boolean;

  @state()
  _search: string = '';

  @state()
  _searchDebounced: string = '';

  private _channelList = new Task(this, {
    task: async ([filter, code]) => {
      this._search = '';
      this._searchDebounced = '';
      if (!filter || !code) return [];

      const result = await window.api.getFilteredActiveChannel(filter as FILTER_TYPE, code);
      return result;
    },
    args: () => [this.filter, this.code]
  });

  private _onChangeSearch = (e: CustomEvent) => {
    const val = e.detail;
    this._search = val;
  };
  private _onChangeSearchDebounced = (e: CustomEvent) => {
    const val = e.detail;
    if (val !== this._searchDebounced) {
      this._searchDebounced = val;
    }
  };

  private _onClickChannel = (channelId: string) => {
    navigate(`home/${this.filter}/${this.code}/${channelId}`);
  };

  private _abortScroll?: AbortController;
  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(ECustomEvent.nextChannel, () => this._handleChannelEvent('next'));
    window.addEventListener(ECustomEvent.prevChannel, () => this._handleChannelEvent('prev'));
    if (this.activeChannelId) {
      this._scrollToChannelId(this.activeChannelId);
    }
  }

  private _scrollToChannelId = (channelId: string) => {
    if (this._abortScroll) {
      this._abortScroll.abort();
    }
    this._abortScroll = new AbortController();
    waitForElement(
      this.shadowRoot!,
      '[channelId="' + channelId + '"]',
      this._abortScroll.signal
    ).then((el) => {
      const position = el.offsetTop - 200;
      this.shadowRoot?.getElementById('channel-grid')?.scrollTo({
        top: position,
        behavior: 'smooth'
      });
    });
  };

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(ECustomEvent.nextChannel, () => this._handleChannelEvent('next'));
    window.removeEventListener(ECustomEvent.prevChannel, () => this._handleChannelEvent('prev'));
    this._abortScroll?.abort();
  }

  private _handleChannelEvent = (type: 'prev' | 'next') => {
    if (this.activeChannelId && this._channelList.value) {
      const currentIdx = this._channelList.value.findIndex(
        (item) => item.id === this.activeChannelId
      );
      if (type === 'prev') {
        var newIdx = currentIdx - 1;
        if (newIdx < 0) {
          newIdx = this._channelList.value.length - 1;
        }
      } else {
        newIdx = currentIdx + 1;
        if (newIdx >= this._channelList.value.length) {
          newIdx = 0;
        }
      }
      const channel = this._channelList.value[newIdx];
      this._onClickChannel(channel.id);
      this._scrollToChannelId(channel.id);
    }
  };

  static styles = css`
    :host(.vertical) {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .top-container {
      display: flex;
      gap: 5px;
      justify-items: space-between;
    }
    .left-component {
      flex: 1;
    }
    header {
      position: sticky;
      top: 0;
      background: ${THEME.BG_COLOR};
      box-shadow: 0 10px 20px ${THEME.BG_COLOR};
      padding: 20px;
    }
    :host(.with-titlebar) header {
      padding-top: 10px;
    }
    header.vertical {
      position: static;
      background: transparent;
      box-shadow: none;
    }
    search-input {
      margin-top: 20px;
      max-width: 400px;
    }
    #channel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      padding: 20px;
    }
    #channel-grid.vertical {
      padding: 40px 20px;
      overflow-y: auto;
      grid-template-columns: 1fr;
      gap: 5px;
      -webkit-mask-image: linear-gradient(
        transparent,
        black 60px,
        black calc(100% - 60px),
        transparent
      );
    }
    #channel-grid.vertical::-webkit-scrollbar {
      display: none;
    }
    @media (min-width: 768px) {
      #channel-grid:not(.vertical) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 1280px) {
      #channel-grid:not(.vertical) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `;

  protected render(): unknown {
    return html`
      <header class="${this.isVertical ? 'vertical' : ''}">
        <div class="top-container">
          <div class="left-component">
            <page-title
              text="Channels"
              backHref=${this.isShowBack ? `#home/${this.filter}/${this.code}` : undefined}
            ></page-title>
            <search-input
              value="${this._search}"
              @change=${this._onChangeSearch}
              @changeDebounced=${this._onChangeSearchDebounced}
              placeholder="Search Channel..."
            />
          </div>
          <slot name="right-component" />
        </div>
      </header>
      <div id="channel-grid" class="${this.isVertical ? 'vertical' : ''}">
        ${this._channelList.render({
          pending: () => html`<spinner-loading></spinner-loading>`,
          complete: (channels) =>
            channels
              .filter(
                (item) =>
                  !this._searchDebounced ||
                  (item.alt_names.join(' ') + ' ' + item.name)
                    .toLowerCase()
                    .includes(this._searchDebounced.toLowerCase())
              )
              .map((channel) => {
                return html`<channel-item
                  channelId="${channel.id}"
                  class="${this.isVertical ? 'vertical' : ''} ${this.activeChannelId === channel.id
                    ? 'active'
                    : ''}"
                  @click="${() => this._onClickChannel(channel.id)}"
                  .logo="${channel.logo}"
                  .name="${channelName(channel)}"
                ></channel-item>`;
              })
        })}
      </div>
    `;
  }
}
