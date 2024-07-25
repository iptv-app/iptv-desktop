import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/layout/page-title';
import { AppConfig } from '../../../preload/config.type';
import { SCROLLBAR_STYLE, THEME } from '../assets/theme';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Captions, Globe, TvMinimalPlay } from 'lucide-static';
import '../components/layout/list-item';
import '../components/form/text-input';
import '../components/form/app-button';
import '../components/form/toggle-switch';
import { Option } from '../components/form/select-item';
import '../components/form/select-item';
import '../components/layout/with-titlebar';

const cacheDurationOptions: Option[] = [
  {
    label: '15 Minutes',
    value: (60 * 15).toString()
  },
  {
    label: '30 Minutes',
    value: (60 * 30).toString()
  },
  {
    label: '1 Hour',
    value: (60 * 60).toString()
  },
  {
    label: '1 Day',
    value: (60 * 60 * 24).toString()
  },
  {
    label: '1 Week',
    value: (60 * 60 * 24 * 7).toString()
  }
];

interface Form {
  iptvIsOverrideApi?: boolean;
  iptvApiUrl?: string;
  iptvCacheDuration?: string;
  iptvIsUseAltChannelName?: boolean;

  networkIsUseDOH?: boolean;
  networkDOHResolverUrl?: string;

  captionIsAutoShow?: boolean;
  captionIsEnableCEA708?: boolean;
}

@customElement('setting-screen')
export class SettingScreen extends LitElement {
  @state()
  _iptvView?: AppConfig['iptvView'];

  @state()
  _form: Form = {
    iptvIsOverrideApi: undefined,
    iptvApiUrl: undefined,
    iptvCacheDuration: undefined,
    iptvIsUseAltChannelName: undefined,

    networkIsUseDOH: undefined,
    networkDOHResolverUrl: undefined,

    captionIsAutoShow: undefined,
    captionIsEnableCEA708: undefined
  };

  constructor() {
    super();

    this._loadData();
  }

  private _loadData = async () => {
    this._iptvView = await window.api.getIptvView();
    const config = await window.api.getAppConfig();
    this._form = {
      iptvIsOverrideApi: config?.iptv?.isOverrideApi,
      iptvApiUrl: config?.iptv?.apiUrl,
      iptvCacheDuration: config?.iptv?.cacheDuration?.toString(),
      iptvIsUseAltChannelName: config?.iptv?.isUseAltChannelName,

      networkIsUseDOH: config?.network?.isUseDOH,
      networkDOHResolverUrl: config?.network?.dohResolverUrl,

      captionIsAutoShow: config?.caption?.isAutoShow,
      captionIsEnableCEA708: config?.caption?.isEnableCEA708
    };
  };

  private _handleChange<T extends keyof typeof this._form>(key: T, value: (typeof this._form)[T]) {
    this._form = {
      ...this._form,
      [key]: value
    };
  }

  private _doSave = () => {
    const val = this._form;
    let dto: AppConfig['app'] = {
      iptv: {
        isOverrideApi: val.iptvIsOverrideApi,
        apiUrl: val.iptvIsOverrideApi ? val.iptvApiUrl : undefined,
        cacheDuration: val.iptvCacheDuration ? parseInt(val.iptvCacheDuration) : undefined,
        isUseAltChannelName: val.iptvIsUseAltChannelName
      },
      network: {
        isUseDOH: val.networkIsUseDOH,
        dohResolverUrl: val.networkIsUseDOH ? val.networkDOHResolverUrl : undefined
      },
      caption: {
        isAutoShow: val.captionIsAutoShow,
        isEnableCEA708: val.captionIsEnableCEA708
      }
    };
    window.api.setAppConfig(dto);
    this._loadData();
  };

  private _scrollTo = (id: string) => {
    const el = this.shadowRoot!.getElementById(id);
    el?.scrollIntoView({
      behavior: 'smooth'
    });
    this._activeSide = id;
  };

  @state()
  _activeSide: string = 'iptv-data';

  static styles = [
    SCROLLBAR_STYLE,
    css`
      :host {
        display: block;
        height: 100%;
      }
      #content {
        margin: 0;
        padding: 0;
        display: flex;
        height: 100%;
        user-select: none;
        overflow: hidden;
      }
      aside {
        width: 300px;
        border-right: 1px solid ${THEME.BORDER_COLOR};
        padding: 40px;
      }
      .sticky {
        position: sticky;
        top: 40px;
      }
      page-title {
        margin-bottom: 40px;
      }
      main {
        padding: 40px;
        flex: 1;
        height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
      }
      h2 {
        margin-top: 0;
        font-size: 24pt;
      }
      .item {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 30px 0;
      }
      fieldset {
        padding: 0;
        margin: 0 0 40px 0;
        border: none;
      }
      .flex {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
      p {
        color: ${THEME.FG_COLOR_MUTED};
        font-size: 0.9rem;
        margin: 8px 0 0 0;
      }
      .right {
        text-align: right;
      }
      .container {
        max-width: 600px;
      }
    `
  ];
  static sideItems = [
    {
      label: 'IPTV Data',
      id: 'iptv-data',
      icon: TvMinimalPlay
    },
    {
      label: 'Network',
      id: 'network',
      icon: Globe
    },
    {
      label: 'Captions',
      id: 'captions',
      icon: Captions
    }
  ];

  protected render(): unknown {
    return html`<with-titlebar>
    <div id="content">
      <aside>
        <div class="sticky">
          <page-title
            text="Settings"
            backHref=${
              this._iptvView?.filter
                ? `#home/${this._iptvView.filter}/${this._iptvView.code ?? ''}`
                : undefined
            }
          ></page-title>
          ${SettingScreen.sideItems.map((item) => {
            return html`<list-item
              @click=${() => this._scrollTo(item.id)}
              label=${item.label}
              class="lg bold ${this._activeSide === item.id ? 'active' : undefined}"
              ><span slot="icon">${unsafeHTML(item.icon)}</span></list-item
            >`;
          })}
        </div>
      </aside>
      <main>
      <div class="container">
        <fieldset>
          <h2 id="iptv-data">IPTV Data</h2>
          <div class="item flex">
            <div>
              <label>Alternative Channel Name</label>
              <p>Use alternative channel name (usually local name).<label>
            </div>
            <toggle-switch ?checked=${this._form.iptvIsUseAltChannelName} @change=${(e: CustomEvent) => this._handleChange('iptvIsUseAltChannelName', e.detail)}></toggle-switch>
          </div>
          <div class="item flex">
            <div>
              <label>Custom API</label>
              <p>Use Custom iptv-org API<label>
            </div>
            <toggle-switch ?checked=${this._form.iptvIsOverrideApi} @change=${(e: CustomEvent) => this._handleChange('iptvIsOverrideApi', e.detail)}></toggle-switch>
          </div>
          <div class="item">
            <label>IPTV API Base URL</label>
            <text-input ?disabled=${!this._form.iptvIsOverrideApi} value=${this._form.iptvApiUrl} @change=${(e: CustomEvent) => this._handleChange('iptvApiUrl', e.detail)}></text-input>
          </div>
          <div class="item">
            <label>API Cache Duration</label>
            <select-item .value=${this._form.iptvCacheDuration} .options=${cacheDurationOptions} @change=${(e: CustomEvent) => this._handleChange('iptvCacheDuration', e.detail)}></select-item>
          </div>
        <app-button @click=${window.api.clearAllCache}>Clear Cache</app-button>
        </fieldset>
        <fieldset>
          <h2 id="network">Network</h2>
          <div class="item flex">
            <div>
              <label>Use DOH</label>
              <p>Use Custom DNS Over HTTPS Resolver<label>
            </div>
            <toggle-switch ?checked=${this._form.networkIsUseDOH} @change=${(e: CustomEvent) => this._handleChange('networkIsUseDOH', e.detail)}></toggle-switch>
          </div>
          <div class="item">
            <label>DOH Resolver URL</label>
            <text-input ?disabled=${!this._form.networkIsUseDOH}  value=${this._form.networkDOHResolverUrl} @change=${(e: CustomEvent) => this._handleChange('networkDOHResolverUrl', e.detail)}></text-input>
          </div>
        </fieldset>
        <fieldset>
          <h2 id="captions">Captions</h2>
          <div class="item flex">
            <div>
              <label>Auto Show Caption</label>
              <p>Automatically select and show available caption.<label>
            </div>
            <toggle-switch ?checked=${this._form.captionIsAutoShow} @change=${(e: CustomEvent) => this._handleChange('captionIsAutoShow', e.detail)}></toggle-switch>
          </div>
          <div class="item flex">
            <div>
              <label>Enable CEA 708</label>
              <p>Enable and show CEA 708 caption.<label>
            </div>
            <toggle-switch ?checked=${this._form.captionIsEnableCEA708} @change=${(e: CustomEvent) => this._handleChange('captionIsEnableCEA708', e.detail)}></toggle-switch>
          </div>
        </fieldset>
        <div class="right"><app-button class="primary" @click=${this._doSave}>Save Settings</app-button></div>
      </div>
      </main>
      </div>
      </with-titlebar>`;
  }
}
