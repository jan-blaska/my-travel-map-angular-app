import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { Country, COUNTRIES } from '../../data/countries';

@Component({
  selector: 'app-country-panel',
  templateUrl: './country-panel.html',
  styleUrl: './country-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryPanelComponent {
  visitedCountries = input<Country[]>([]);
  countryAdded = output<Country>();
  countryRemoved = output<Country>();

  protected searchQuery = signal('');
  protected showSuggestions = signal(false);
  protected focusedIndex = signal(-1);

  protected filteredSuggestions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    const visitedIds = new Set(this.visitedCountries().map(c => c.id));
    return COUNTRIES.filter(
      c => !visitedIds.has(c.id) && c.name.toLowerCase().includes(q)
    ).slice(0, 8);
  });

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.showSuggestions.set(true);
    this.focusedIndex.set(-1);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const suggestions = this.filteredSuggestions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.showSuggestions.set(true);
        this.focusedIndex.update(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(i => Math.max(i - 1, -1));
        break;
      case 'Enter': {
        event.preventDefault();
        const idx = this.focusedIndex();
        const country = idx >= 0 ? suggestions[idx] : suggestions[0];
        if (country) this.selectCountry(country);
        break;
      }
      case 'Escape':
        this.showSuggestions.set(false);
        this.focusedIndex.set(-1);
        break;
    }
  }

  protected onBlur(): void {
    // Delay so click on suggestion can fire first
    setTimeout(() => {
      this.showSuggestions.set(false);
      this.focusedIndex.set(-1);
    }, 150);
  }

  protected selectCountry(country: Country): void {
    this.countryAdded.emit(country);
    this.searchQuery.set('');
    this.showSuggestions.set(false);
    this.focusedIndex.set(-1);
  }

  protected removeCountry(country: Country): void {
    this.countryRemoved.emit(country);
  }
}
