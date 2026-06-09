import { Injectable, inject } from '@angular/core';
import type { Firestore } from 'firebase/firestore';
import { AppUrlService } from './app-url.service';
import { FirebaseRuntimeConfig } from '../models/firebase-config.model';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly appUrl = inject(AppUrlService);
  private initialization: Promise<Firestore> | null = null;

  firestore(): Promise<Firestore> {
    this.initialization ??= this.initialize();
    return this.initialization;
  }

  private async initialize(): Promise<Firestore> {
    const response = await fetch(this.appUrl.resolve('firebase-config.json'));
    if (!response.ok) {
      throw new Error(`Firebase configuration request failed with ${response.status}.`);
    }

    const config = (await response.json()) as FirebaseRuntimeConfig;
    if (
      !config.firebase?.apiKey ||
      !config.firebase?.projectId
    ) {
      throw new Error(
        'Firestore is not configured. Update public/firebase-config.json before starting Manuscript.'
      );
    }

    const [{ initializeApp }, { connectFirestoreEmulator, getFirestore }] =
      await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    const app = initializeApp(config.firebase);
    const firestore = getFirestore(app);

    if (
      config.emulator?.enabled &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ) {
      connectFirestoreEmulator(
        firestore,
        config.emulator.host || '127.0.0.1',
        config.emulator.port || 8080
      );
    }

    if (config.appCheck?.enabled && config.appCheck.siteKey) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import(
        'firebase/app-check'
      );
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(config.appCheck.siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }

    return firestore;
  }
}
