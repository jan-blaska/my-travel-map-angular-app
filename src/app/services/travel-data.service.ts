import { Injectable, effect, inject, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import { COUNTRY_NAME_BY_ID } from '../data/countries';

@Injectable({ providedIn: 'root' })
export class TravelDataService {
  private authService = inject(AuthService);

  readonly visitedIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadCountries(user.uid);
      } else {
        this.visitedIds.set(new Set());
      }
    });
  }

  private async loadCountries(uid: string): Promise<void> {
    const snap = await getDoc(doc(db, 'users', uid));
    const ids: string[] = snap.exists() ? (snap.data()['visitedCountries'] ?? []) : [];
    const normalized = ids.map(id => String(Number(id)));
    this.visitedIds.set(new Set(normalized.filter(id => COUNTRY_NAME_BY_ID.has(id))));
  }

  async toggleCountry(id: string): Promise<void> {
    this.visitedIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    await this.persist();
  }

  async addCountry(id: string): Promise<void> {
    this.visitedIds.update(ids => new Set([...ids, id]));
    await this.persist();
  }

  async removeCountry(id: string): Promise<void> {
    this.visitedIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
    await this.persist();
  }

  private async persist(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    await setDoc(doc(db, 'users', uid), {
      visitedCountries: [...this.visitedIds()],
    });
  }
}
