import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FILTER_TYPE, IPTVCategory, IPTVChannel, IPTVCountry } from '../../../preload/iptv.type';
import { Task } from '@lit/task';
import './channel-item';
import { THEME } from '../assets/theme';
import { navigate } from '../utils/routing';
import { waitForElement } from '../utils/dom';
import { ECustomEvent } from '../utils/event';
import './layout/page-title';
import './form/search-input';
import './form/select-item';
import './layout/spinner-loading';
import './layout/empty-list';
import { channelName } from '../utils/channel';
import { Option } from './form/select-item';

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

  @state()
  _favorites: string[] = [];

  @state()
  _countryFilter: string = 'all';

  @state()
  _categoryFilter: string = 'all';

  @state()
  _countryOptions: Option[] = [{ label: 'All Countries', value: 'all' }];

  @state()
  _categoryOptions: Option[] = [{ label: 'All Categories', value: 'all' }];

  private _channelList = new Task(this, {
    task: async ([filter, code]) => {
      this._search = '';
      this._searchDebounced = '';
      if (!filter || !code) return [];

      const [result, favs] = await Promise.all([
        window.api.getFilteredActiveChannel(filter as FILTER_TYPE, code),
        window.api.getFavorites()
      ]);
      this._favorites = favs;
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
  private _onChangeCountryFilter = (e: CustomEvent) => {
    this._countryFilter = e.detail;
  };

  private _onChangeCategoryFilter = (e: CustomEvent) => {
    this._categoryFilter = e.detail;
  };

  private _onClickChannel = (channelId: string) => {
    navigate(`home/${this.filter}/${this.code}/${channelId}`);
  };

  private _abortScroll?: AbortController;
  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(ECustomEvent.nextChannel, () => this._handleChannelEvent('next'));
    window.addEventListener(ECustomEvent.prevChannel, () => this._handleChannelEvent('prev'));
    void this._loadFilterOptions();
    if (this.activeChannelId) {
      this._scrollToChannelId(this.activeChannelId);
    }
  }

  private _loadFilterOptions = async () => {
    const [countries, categories] = await Promise.all([
      window.api.getAllCountry(),
      window.api.getAllCategory()
    ]);
    this._countryOptions = [
      { label: 'All Countries', value: 'all' },
      ...countries
        .map((item: IPTVCountry) => ({ label: `${item.flag} ${item.name}`, value: item.code }))
        .sort((a, b) => a.label.localeCompare(b.label))
    ];
    this._categoryOptions = [
      { label: 'All Categories', value: 'all' },
      ...categories
        .map((item: IPTVCategory) => ({ label: item.name, value: item.id }))
        .sort((a, b) => a.label.localeCompare(b.label))
    ];
  };

  private _fuzzyScore(sourceRaw: string, queryRaw: string) {
    const source = sourceRaw.toLowerCase();
    const query = queryRaw.trim().toLowerCase();
    if (!query) return 1;
    if (source.includes(query)) {
      return 10 + query.length / source.length;
    }
    let queryIdx = 0;
    let score = 0;
    let streak = 0;
    for (let i = 0; i < source.length; i++) {
      if (source[i] === query[queryIdx]) {
        queryIdx += 1;
        streak += 1;
        score += 1 + streak * 0.5;
        if (queryIdx === query.length) break;
      } else {
        streak = 0;
      }
    }
    if (queryIdx !== query.length) return 0;
    return score / source.length;
  }

  private _channelSearchScore(channel: IPTVChannel) {
    const query = this._searchDebounced;
    if (!query) return 1;
    const searchableValues = [
      channel.name,
      channel.alt_names.join(' '),
      channel.id,
      channel.country,
      channel.categories.join(' ')
    ];
    return searchableValues.reduce((best, text) => Math.max(best, this._fuzzyScore(text, query)), 0);
  }

  private _isChannelVisible(channel: IPTVChannel) {
    const isCountryMatched = this._countryFilter === 'all' || channel.country === this._countryFilter;
    const isCategoryMatched =
      this._categoryFilter === 'all' || channel.categories.includes(this._categoryFilter);
    const searchScore = this._channelSearchScore(channel);
    const isSearchMatched = !this._searchDebounced || searchScore > 0;
    return isCountryMatched && isCategoryMatched && isSearchMatched;
  }

  private _getVisibleChannels(channels: readonly IPTVChannel[]): IPTVChannel[] {
    const isSearchEnabled = this._searchDebounced.trim().length > 0;
    const filtered = channels.filter((channel) => this._isChannelVisible(channel));
    if (!isSearchEnabled) return filtered;
    return filtered
      .map((channel) => ({
        channel,
        score: this._channelSearchScore(channel)
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.channel);
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
      const visibleChannels = this._getVisibleChannels(this._channelList.value);
      if (visibleChannels.length === 0) return;
      const currentIdx = visibleChannels.findIndex((item) => item.id === this.activeChannelId);
      if (type === 'prev') {
        var newIdx = currentIdx - 1;
        if (newIdx < 0) {
          newIdx = visibleChannels.length - 1;
        }
      } else {
        newIdx = currentIdx + 1;
        if (newIdx >= visibleChannels.length) {
          newIdx = 0;
        }
      }
      const channel = visibleChannels[newIdx];
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
    .search-filters {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 10px;
      max-width: 600px;
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
            <div class="search-filters">
              <select-item
                .value=${this._countryFilter}
                .options=${this._countryOptions}
                @change=${this._onChangeCountryFilter}
                placeholder="Filter by country"
              ></select-item>
              <select-item
                .value=${this._categoryFilter}
                .options=${this._categoryOptions}
                @change=${this._onChangeCategoryFilter}
                placeholder="Filter by category"
              ></select-item>
            </div>
          </div>
          <slot name="right-component" />
        </div>
      </header>
      ${this._channelList.render({
        pending: () => html`<spinner-loading></spinner-loading>`,
        complete: (channels) => {
          const visibleChannels = this._getVisibleChannels(channels);
          if (channels.length === 0)
            return html`<empty-list
              text="${this.code
                ? 'The channel list is empty!'
                : 'Choose ' + this.filter + ' first!'}"
            ></empty-list>`;
          if (visibleChannels.length === 0)
            return html`<empty-list text="No channels match your search and filters."></empty-list>`;
          return html`<div id="channel-grid" class="${this.isVertical ? 'vertical' : ''}">
            ${visibleChannels.map((channel) => {
                return html`<channel-item
                  channelId="${channel.id}"
                  class="${this.isVertical ? 'vertical' : ''} ${this.activeChannelId === channel.id
                    ? 'active'
                    : ''}"
                  @click="${() => this._onClickChannel(channel.id)}"
                  ?isFavorite="${this._favorites.includes(channel.id)}"
                  @favorite-toggled="${(e: CustomEvent) => {
                    const { channelId, isFavorite } = e.detail;
                    if (isFavorite) {
                      this._favorites = [...this._favorites, channelId];
                    } else {
                      this._favorites = this._favorites.filter(id => id !== channelId);
                      if (this.filter === 'favorites') {
                        this._channelList.run([this.filter, this.code]);
                      }
                    }
                  }}"
                  .logo="${channel.logo}"
                  .name="${channelName(channel)}"
                ></channel-item>`;
              })}
          </div>`;
        }
      })}
    `;
  }
}
