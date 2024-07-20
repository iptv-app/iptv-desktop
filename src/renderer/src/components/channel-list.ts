import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import { Task } from '@lit/task';
import './channel-item';
import { INPUT_FOCUS_STYLE, INPUT_STYLE, THEME } from '../assets/theme';
import { navigate } from '../utils/routing';

@customElement('channel-list')
export class ChannelList extends LitElement {
  @property()
  type?: FILTER_TYPE;

  @property()
  code?: string;

  @state()
  _search: string = '';

  @state()
  _searchDebounced: string = '';

  private _channelList = new Task(this, {
    task: async ([type, code]) => {
      this._search = '';
      this._searchDebounced = '';
      clearTimeout(this._searchDebounceId);
      if (!type || !code) return [];

      const result = await window.api.getFilteredActiveChannel(type as FILTER_TYPE, code);
      return result;
    },
    args: () => [this.type, this.code]
  });

  private _searchDebounceId?: NodeJS.Timeout;
  private _onChangeSearch = (e) => {
    const val = e.target.value;
    this._search = val;
    clearTimeout(this._searchDebounceId);

    this._searchDebounceId = setTimeout(() => {
      this._searchDebounced = val;
    }, 300);
  };

  private _onClickChannel = (channelId: string) => {
    navigate(`home/${this.type}/${this.code}/${channelId}`);
  };

  static styles = css`
    :host header {
      position: sticky;
      top: 0;
      background: ${THEME.BG_COLOR};
      box-shadow: 0 10px 20px ${THEME.BG_COLOR};
      padding: 20px;
    }
    :host header h1 {
      margin: 0;
      padding: 0;
    }
    :host header input {
      ${INPUT_STYLE}
      margin-top: 20px;
      max-width: 400px;
    }
    :host header input:focus {
      ${INPUT_FOCUS_STYLE}
    }
    :host .channel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      padding: 20px;
    }
    @media (min-width: 768px) {
      :host .channel-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 1280px) {
      :host .channel-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `;

  protected render(): unknown {
    return html`
      <header>
        <h1>Channels</h1>
        <input
          .value="${this._search}"
          @input="${this._onChangeSearch}"
          type="text"
          placeholder="Search Channel..."
        />
      </header>
      <div class="channel-grid">
        ${this._channelList.render({
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
                  @click="${() => this._onClickChannel(channel.id)}"
                  logo="${channel.logo}"
                  name="${channel.alt_names[0] ?? channel.name}"
                ></channel-item>`;
              })
        })}
      </div>
    `;
  }
}
