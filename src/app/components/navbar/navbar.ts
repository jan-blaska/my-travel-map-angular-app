import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TravelDataService } from '../../services/travel-data.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  private travelData = inject(TravelDataService);

  protected isDropdownOpen = signal(false);

  protected visitedCount = computed(() => this.travelData.visitedIds().size);

  protected firstName = computed(() => {
    const name = this.auth.currentUser()?.displayName ?? '';
    return name.split(' ')[0];
  });

  protected toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
  }

  protected closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  protected signIn(): void {
    this.auth.signInWithGoogle();
  }

  protected signOut(): void {
    this.isDropdownOpen.set(false);
    this.auth.signOut();
  }
}
