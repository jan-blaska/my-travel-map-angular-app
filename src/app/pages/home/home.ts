import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { COUNTRIES, Country } from '../../data/countries';
import { WorldMapComponent } from '../../components/world-map/world-map';
import { CountryPanelComponent } from '../../components/country-panel/country-panel';
import { TravelDataService } from '../../services/travel-data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorldMapComponent, CountryPanelComponent],
})
export class HomeComponent {
  private travelData = inject(TravelDataService);

  protected visitedCountryIds = this.travelData.visitedIds;

  protected visitedCountries = computed(() =>
    COUNTRIES.filter(c => this.travelData.visitedIds().has(c.id))
  );

  protected addCountry(country: Country): void {
    this.travelData.addCountry(country.id);
  }

  protected removeCountry(country: Country): void {
    this.travelData.removeCountry(country.id);
  }

  protected toggleCountry(id: string): void {
    this.travelData.toggleCountry(id);
  }
}
