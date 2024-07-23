import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { THEME } from './assets/theme';
import './screens/home';
import './screens/watch';
import './screens/setting';

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
        channel="${params[3]}"
      ></watch-screen>`
  },
  {
    regex: /^home\/?(country|category|language)?\/?(.*?)?$/,
    view: (params) => html`<home-screen filter="${params[1]}" code="${params[2]}"></home-screen>`
  },
  {
    regex: /^setting$/,
    view: () => html`<setting-screen></setting>`
  }
];

@customElement('app-router')
export class AppRouter extends LitElement {
  @state()
  view: unknown = undefined;

  constructor() {
    super();
    this._handleHashChange();
  }

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

  static styles = css`
    :host {
      background-color: ${THEME.BG_COLOR};
      color: ${THEME.FG_COLOR};
    }
  `;

  protected render(): unknown {
    if (this.view !== undefined) return this.view;
    return html`NOT FOUND!`;
  }
}
