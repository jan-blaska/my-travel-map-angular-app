import { Injectable, NgZone, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private zone = inject(NgZone);

  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal(true);

  constructor() {
    onAuthStateChanged(auth, user => {
      this.zone.run(() => {
        this.currentUser.set(user);
        this.isLoading.set(false);
      });
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }
}
