import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/layout/page-title';
import { AppConfig } from '../../../preload/config.type';
import { SCROLLBAR_STYLE, THEME } from '../assets/theme';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { Globe, TvMinimalPlay } from 'lucide-static';
import '../components/layout/list-item';
import '../components/form/text-input';
import '../components/form/app-button';
import '../components/form/toggle-switch';
import { Option } from '../components/form/select-item';
import '../components/form/select-item';

const cacheDurationOptions: Option[] = [
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

  networkIsUseDOH?: boolean;
  networkDOHResolverUrl?: string;
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

    networkIsUseDOH: undefined,
    networkDOHResolverUrl: undefined
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

      networkIsUseDOH: config?.network?.isUseDOH,
      networkDOHResolverUrl: config?.network?.dohResolverUrl
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
        cacheDuration: val.iptvCacheDuration ? parseInt(val.iptvCacheDuration) : undefined
      },
      network: {
        isUseDOH: val.networkIsUseDOH,
        dohResolverUrl: val.networkIsUseDOH ? val.networkDOHResolverUrl : undefined
      }
    };
    window.api.setAppConfig(dto);
    this._loadData();
  };

  static styles = [
    SCROLLBAR_STYLE,
    css`
      :host {
        margin: 0;
        padding: 0;
        display: flex;
        height: 100vh;
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
  protected render(): unknown {
    return html`
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
          <list-item label="IPTV Data" class="lg bold active"
            ><span slot="icon">${unsafeHTML(TvMinimalPlay)}</span></list-item
          >
          <list-item label="Network" class="lg bold"
            ><span slot="icon">${unsafeHTML(Globe)}</span></list-item
          >
        </div>
      </aside>
      <main>
      <div class="container">
        <fieldset>
          <h2>IPTV Data</h2>
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
          <h2>Network</h2>
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
        <div class="right"><app-button class="primary" @click=${this._doSave}>Save Settings</app-button></div>
        </div>
      </main>
    `;
  }
}
