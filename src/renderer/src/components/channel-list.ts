import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FILTER_TYPE } from '../../../preload/iptv.type';
import { Task } from '@lit/task';
import './channel-item';

@customElement('channel-list')
export class ChannelList extends LitElement {
  @property()
  type?: FILTER_TYPE;

  @property()
  code?: string;

  private _channelList = new Task(this, {
    task: async ([type, code]) => {
      if (!type || !code) return [];

      const result = await window.api.getFilteredActiveChannel(type as FILTER_TYPE, code);
      return result;
    },
    args: () => [this.type, this.code]
  });

  static styles = css`
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
      <div class="channel-grid">
        ${this._channelList.render({
          complete: (channels) =>
            channels.map((channel) => {
              return html`<channel-item
                logo="${channel.logo}"
                name="${channel.alt_names[0] ?? channel.name}"
              ></channel-item>`;
            })
        })}
      </div>
    `;
  }
}
