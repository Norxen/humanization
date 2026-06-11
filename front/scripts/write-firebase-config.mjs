import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(directory, '..', 'public', 'firebase-config.json');
const useEmulator = process.argv.includes('--emulator');
const localProjectId = 'humanization-1c628';
const required = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];
const missing = useEmulator
  ? []
  : required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(
    `Missing Firebase configuration variables: ${missing.join(', ')}.`
  );
}

const config = useEmulator
  ? {
      firebase: {
        apiKey: 'demo-api-key',
        authDomain: `${localProjectId}.firebaseapp.com`,
        projectId: localProjectId,
        storageBucket: `${localProjectId}.appspot.com`,
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:local'
      },
      appCheck: {
        siteKey: '',
        enabled: false
      },
      emulator: {
        enabled: true,
        host: '127.0.0.1',
        port: 8080,
        authPort: 9099
      }
    }
  : {
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      },
      appCheck: {
        siteKey: process.env.FIREBASE_APP_CHECK_SITE_KEY ?? '',
        enabled: Boolean(process.env.FIREBASE_APP_CHECK_SITE_KEY)
      },
      emulator: {
        enabled: false,
        host: '127.0.0.1',
        port: 8080,
        authPort: 9099
      }
    };

await writeFile(target, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`Wrote Firebase runtime configuration to ${target}.`);
