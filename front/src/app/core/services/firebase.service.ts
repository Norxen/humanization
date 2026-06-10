import { Injectable, inject } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { AppUrlService } from './app-url.service';
import { FirebaseRuntimeConfig } from '../models/firebase-config.model';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly appUrl = inject(AppUrlService);
  private configInitialization: Promise<FirebaseRuntimeConfig> | null = null;
  private appInitialization: Promise<FirebaseApp> | null = null;
  private firestoreInitialization: Promise<Firestore> | null = null;

  config(): Promise<FirebaseRuntimeConfig> {
    this.configInitialization ??= this.loadConfig();
    return this.configInitialization;
  }

  app(): Promise<FirebaseApp> {
    this.appInitialization ??= this.initializeApp();
    return this.appInitialization;
  }

  firestore(): Promise<Firestore> {
    this.firestoreInitialization ??= this.initializeFirestore();
    return this.firestoreInitialization;
  }

  private async loadConfig(): Promise<FirebaseRuntimeConfig> {
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
        'Firestore is not configured. Generate the runtime configuration before starting Manuscript.'
      );
    }
    return config;
  }

  private async initializeApp(): Promise<FirebaseApp> {
    const config = await this.config();
    const { initializeApp } = await import('firebase/app');
    const app = initializeApp(config.firebase);

    if (config.appCheck?.enabled && config.appCheck.siteKey) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import(
        'firebase/app-check'
      );
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(config.appCheck.siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }

    return app;
  }

  private async initializeFirestore(): Promise<Firestore> {
    const [config, app, { connectFirestoreEmulator, getFirestore }] =
      await Promise.all([
        this.config(),
        this.app(),
        import('firebase/firestore')
      ]);
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

    return firestore;
  }
}
