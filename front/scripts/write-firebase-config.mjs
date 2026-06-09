import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(directory, '..', 'public', 'firebase-config.json');
const existing = JSON.parse(await readFile(target, 'utf8'));
const required = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_APP_ID'
];
const configuredValues = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || existing.firebase?.apiKey,
  FIREBASE_AUTH_DOMAIN:
    process.env.FIREBASE_AUTH_DOMAIN || existing.firebase?.authDomain,
  FIREBASE_PROJECT_ID:
    process.env.FIREBASE_PROJECT_ID || existing.firebase?.projectId,
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || existing.firebase?.appId
};
const missing = required.filter((name) => !configuredValues[name]);
if (missing.length) {
  throw new Error(`Missing Firebase configuration variables: ${missing.join(', ')}.`);
}

const config = {
  firebase: {
    apiKey: configuredValues.FIREBASE_API_KEY,
    authDomain: configuredValues.FIREBASE_AUTH_DOMAIN,
    projectId: configuredValues.FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || existing.firebase?.storageBucket,
    messagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      existing.firebase?.messagingSenderId,
    appId: configuredValues.FIREBASE_APP_ID
  },
  appCheck: {
    siteKey:
      process.env.FIREBASE_APP_CHECK_SITE_KEY || existing.appCheck?.siteKey || '',
    enabled: Boolean(
      process.env.FIREBASE_APP_CHECK_SITE_KEY || existing.appCheck?.siteKey
    )
  },
  emulator: {
    enabled: false,
    host: '127.0.0.1',
    port: 8080
  }
};

await writeFile(target, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`Wrote Firebase runtime configuration to ${target}.`);
