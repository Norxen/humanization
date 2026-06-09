import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter } from './generate-docs-manifest.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const docsDirectory = path.join(projectDirectory, 'public', 'docs', 'game-design');
const manifestPath = path.join(projectDirectory, 'public', 'docs', 'manifest.json');
const force = process.argv.includes('--force');
const projectArgument = process.argv.find((argument) => argument.startsWith('--project='));
if (process.argv.includes('--emulator') && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}
const projectId =
  projectArgument?.slice('--project='.length) ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'manuscript-local';

const app = initializeApp(
  process.env.FIRESTORE_EMULATOR_HOST
    ? { projectId }
    : {
        credential: applicationDefault(),
        projectId
      }
);
const firestore = getFirestore(app);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let created = 0;
let skipped = 0;
let replaced = 0;

for (const descriptor of manifest.pages) {
  const source = await readFile(path.join(docsDirectory, ...descriptor.path.split('/')), 'utf8');
  const { body, metadata } = parseFrontMatter(source, descriptor.path);
  const reference = firestore.collection('documents').doc(encodeURIComponent(descriptor.path));
  const existing = await reference.get();

  if (existing.exists && !force) {
    skipped += 1;
    continue;
  }

  const timestamps = existing.exists
    ? { createdAt: existing.data().createdAt, updatedAt: FieldValue.serverTimestamp() }
    : {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

  if (existing.exists) {
    const current = existing.data();
    const currentVersion = Number(current.version ?? 0);
    await firestore.runTransaction(async (transaction) => {
      transaction.set(reference.collection('revisions').doc(String(currentVersion)), {
        path: current.path,
        body: current.body,
        version: currentVersion,
        lastReviewed: current.lastReviewed,
        createdAt: FieldValue.serverTimestamp()
      });
      transaction.set(reference, {
        path: descriptor.path,
        body,
        version: currentVersion + 1,
        lastReviewed: metadata.lastReviewed,
        ...timestamps
      });
    });
  } else {
    await reference.set({
      path: descriptor.path,
      body,
      version: 1,
      lastReviewed: metadata.lastReviewed,
      ...timestamps
    });
  }

  existing.exists ? (replaced += 1) : (created += 1);
}

console.log(
  `Firestore seed complete: ${created} created, ${replaced} replaced, ${skipped} skipped.`
);
