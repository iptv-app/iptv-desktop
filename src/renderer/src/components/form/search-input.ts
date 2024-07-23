import { customElement } from 'lit/decorators.js';
import { TextInput } from './text-input';

@customElement('search-input')
export class SearchInput extends TextInput {
  private _searchDebounceId?: NodeJS.Timeout;
  protected onChange(e) {
    super.onChange(e);

    clearTimeout(this._searchDebounceId);
    const value = e.target.value;
    this._searchDebounceId = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('changeDebounced', {
          detail: value
        })
      );
    }, 300);
  }
}
