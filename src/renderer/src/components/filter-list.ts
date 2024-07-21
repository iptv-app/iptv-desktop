import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Task } from '@lit/task';
import './filter-item';
import { INPUT_FOCUS_STYLE, INPUT_STYLE, THEME } from '../assets/theme';
import './filter-select';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import { waitForElement } from '../utils/dom';

type ListItem = {
  code: string;
  label: string;
  icon?: string;
};

@customElement('filter-list')
export class FilterList extends LitElement {
  @property()
  filter?: FILTER_TYPE;

  _code?: string;
  @property()
  code?: string;

  @state()
  _search: string = '';

  @state()
  _searchDebounced: string = '';

  private _onChangeCode = (code: string) => {
    const ev = new CustomEvent('changeCode', {
      detail: { code }
    });
    this.dispatchEvent(ev);
  };

  private _onChangeFilter = (e: CustomEvent) => {
    const newEvent = new CustomEvent('changeFilter', {
      detail: {
        filter: e.detail.value
      }
    });
    this.dispatchEvent(newEvent);
    this._search = '';
    this._searchDebounced = '';
    clearTimeout(this._searchDebounceId);
    this.scrollTo({
      top: 0
    });
  };

  private _searchDebounceId?: NodeJS.Timeout;
  private _onChangeSearch = (e) => {
    const val = e.target.value;
    this._search = val;
    clearTimeout(this._searchDebounceId);

    this._searchDebounceId = setTimeout(() => {
      this._searchDebounced = val;
    }, 300);
  };

  private _filterContents = new Task(this, {
    task: async ([type]) => {
      var results: ListItem[];
      switch (type) {
        case 'country':
          let res = await window.api.getAllCountry();
          results = res.map((item) => ({ code: item.code, icon: item.flag, label: item.name }));
          break;

        case 'category':
          let rescat = await window.api.getAllCategory();
          results = rescat.map((item) => ({ code: item.id, label: item.name }));
          break;

        case 'language':
          let reslang = await window.api.getAllLanguage();
          results = reslang.map((item) => ({ code: item.code, label: item.name }));
          break;

        default:
          results = [];
      }

      return results;
    },
    args: () => [this.filter]
  });

  static abortScroll = new AbortController();
  connectedCallback(): void {
    super.connectedCallback();
    if (this.code) {
      waitForElement(this.shadowRoot!, '#item-' + this.code, FilterList.abortScroll.signal).then(
        (el) => {
          const position = el.offsetTop - 200;
          this.scrollTo({
            top: position
          });
        }
      );
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    FilterList.abortScroll.abort();
  }

  static styles = css`
    :host {
      margin: 0;
      display: block;
    }
    :host header {
      position: sticky;
      top: 0;
      background: ${THEME.BG_COLOR};
      padding-bottom: 5px;
      box-shadow: 0 10px 20px ${THEME.BG_COLOR};
      margin-bottom: 10px;
      padding: 0 10px;
    }
    :host header filter-select {
      padding: 20px 0;
    }
    :host header input {
      ${INPUT_STYLE}
    }
    :host header input:focus {
      ${INPUT_FOCUS_STYLE}
    }
    :host .items {
      padding: 10px;
    }
  `;

  protected render(): unknown {
    return html`
      <header>
        <filter-select
          @changeValue="${this._onChangeFilter}"
          value="${this.filter}"
        ></filter-select>
        <input
          .value="${this._search}"
          @input="${this._onChangeSearch}"
          type="text"
          placeholder="Search here..."
        />
      </header>
      <div class="items">
        ${this._filterContents.render({
          complete: (items) =>
            items
              .filter(
                (item) =>
                  !this._searchDebounced ||
                  ((item.icon ?? '') + item.label)
                    .toLowerCase()
                    .includes(this._searchDebounced.toLowerCase())
              )
              .map((item) => {
                return html`<filter-item
                  id="item-${item.code}"
                  @click="${() => this._onChangeCode(item.code)}"
                  class="${this.code === item.code ? 'active' : ''}"
                  label="${item.label}"
                  icon="${item.icon}"
                ></filter-item>`;
              })
        })}
      </div>
    `;
  }
}
