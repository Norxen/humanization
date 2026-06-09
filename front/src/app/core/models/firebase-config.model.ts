export interface FirebaseRuntimeConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
  };
  appCheck?: {
    siteKey: string;
    enabled: boolean;
  };
  emulator?: {
    enabled: boolean;
    host: string;
    port: number;
  };
}
