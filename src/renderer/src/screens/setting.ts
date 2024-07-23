import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('setting-screen')
export class SettingScreen extends LitElement {
  protected render(): unknown {
    return html` <h1>Settings</h1> `;
  }
}
