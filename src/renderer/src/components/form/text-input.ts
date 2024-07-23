import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, INPUT_STYLE } from '../../assets/theme';

@customElement('text-input')
export class TextInput extends LitElement {
  @property()
  value?: string;

  @property()
  placeholder?: string;

  protected onChange(e) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: e.target.value
      })
    );
  }

  static styles = css`
    :host {
      display: block;
    }
    input {
      ${INPUT_STYLE}
    }
    input:focus {
      ${INPUT_FOCUS_STYLE}
    }
  `;

  protected render(): unknown {
    return html`<input
      type="text"
      .value=${this.value}
      @input="${this.onChange}"
      placeholder=${this.placeholder}
    />`;
  }
}
