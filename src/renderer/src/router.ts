import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SCROLLBAR_STYLE, THEME } from './assets/theme';
import './screens/home';
import './screens/watch';
import './screens/setting';
import './components/layout/spinner-loading';
import { AppConfig } from '../../preload/config.type';

interface RouteItem {
  view: (params: RegExpExecArray) => unknown;
}

const ROUTES: Array<RouteItem & { regex: RegExp }> = [
  {
    regex: /^home\/(country|category|language)\/(.*?)\/(.*?)$/,
    view: (params) =>
      html`<watch-screen
        filter="${params[1]}"
        code="${params[2]}"
        channelId="${params[3]}"
      ></watch-screen>`
  },
  {
    regex: /^home\/?(country|category|language)?\/?(.*?)?$/,
    view: (params) => html`<home-screen filter="${params[1]}" code="${params[2]}"></home-screen>`
  },
  {
    regex: /^setting$/,
    view: () => html`<setting-screen></setting-screen>`
  }
];

@customElement('app-router')
export class AppRouter extends LitElement {
  @state()
  isLoaded = false;

  @state()
  view: unknown = undefined;

  constructor() {
    super();
    this._handleHashChange();
    this._waitConfig();
  }

  private _waitConfig = async () => {
    const config: AppConfig['app'] = await window.api.getAppConfig();
    window.__appConfig = config;
    this.isLoaded = true;
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('hashchange', this._handleHashChange);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._handleHashChange);
  }

  private _handleHashChange = async () => {
    const currentHash = window.location.hash.substring(1);
    var params;
    for (const route of ROUTES) {
      if ((params = route.regex.exec(currentHash)) !== null) {
        this.view = route.view(params);
        break;
      }
    }
  };

  static styles = [
    SCROLLBAR_STYLE,
    css`
      :host {
        background-color: ${THEME.BG_COLOR};
        color: ${THEME.FG_COLOR};
        display: block;
        height: 100vh;
      }
      spinner-loading {
        height: 100vh;
      }
    `
  ];

  protected render(): unknown {
    if (!this.isLoaded) return html`<spinner-loading></spinner-loading>`;
    if (this.view !== undefined) return this.view;
    return html`NOT FOUND!`;
  }
}
