import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Country, COUNTRIES } from '../../data/countries';
import { WorldMapComponent } from '../../components/world-map/world-map';
import { CountryPanelComponent } from '../../components/country-panel/country-panel';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorldMapComponent, CountryPanelComponent],
})
export class HomeComponent {
  private _visitedIds = signal<Set<string>>(new Set());

  protected visitedCountryIds = this._visitedIds.asReadonly();

  protected visitedCountries = computed(() =>
    COUNTRIES.filter(c => this._visitedIds().has(c.id))
  );

  protected addCountry(country: Country): void {
    this._visitedIds.update(ids => new Set([...ids, country.id]));
  }

  protected removeCountry(country: Country): void {
    this._visitedIds.update(ids => {
      const next = new Set(ids);
      next.delete(country.id);
      return next;
    });
  }

  protected toggleCountry(id: string): void {
    this._visitedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
