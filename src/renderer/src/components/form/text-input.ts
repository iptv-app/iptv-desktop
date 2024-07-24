import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { INPUT_FOCUS_STYLE, INPUT_STYLE, THEME } from '../../assets/theme';

@customElement('text-input')
export class TextInput extends LitElement {
  @property()
  value?: string;

  @property()
  placeholder?: string;

  @property({
    type: Boolean
  })
  disabled?: boolean;

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
      font-size: 1rem;
    }
    input:focus {
      ${INPUT_FOCUS_STYLE}
    }
    input[disabled] {
      background-color: ${THEME.BG_SECONDARY_COLOR};
      cursor: not-allowed;
      color: ${THEME.FG_COLOR_MUTED};
    }
  `;

  protected render(): unknown {
    return html`<input
      type="text"
      .value=${this.value ?? ''}
      @input="${this.onChange}"
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
    />`;
  }
}
