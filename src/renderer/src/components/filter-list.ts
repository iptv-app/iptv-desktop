import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Task } from '@lit/task';
import './filter-item';
import { THEME } from '../assets/theme';
import './filter-select';
import { FILTER_TYPE } from '../../../preload/iptv.type';

type ListItem = {
  code: string;
  label: string;
  icon?: string;
};

@customElement('filter-list')
export class FilterList extends LitElement {
  @property()
  filter?: FILTER_TYPE;

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
      width: 100%;
      box-sizing: border-box;
      background-color: transparent;
      border: 2px solid ${THEME.BG_SECONDARY_COLOR};
      border-radius: 5px;
      padding: 10px;
    }
    :host header input:focus {
      outline: 2px solid ${THEME.PRIMARY_COLOR};
      outline-offset: 2px;
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
