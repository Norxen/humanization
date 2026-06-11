import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(directory, '..');
const manifestPath = path.join(projectDirectory, 'public', 'docs', 'manifest.json');
const args = new Map(
  process.argv.slice(2).filter((value) => value.startsWith('--') && value.includes('='))
    .map((value) => {
      const [key, ...rest] = value.slice(2).split('=');
      return [key, rest.join('=')];
    })
);
const dryRun = process.argv.includes('--dry-run');
const emulator = process.argv.includes('--emulator');
if (emulator && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}

const firebaseProjectId =
  args.get('project') ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'humanization-1c628';
const ownerId = args.get('owner') || (emulator ? 'editor-user' : '');
if (!ownerId) {
  throw new Error('Pass the existing Firebase user UID with --owner=<uid>.');
}

const app = initializeApp(
  emulator
    ? { projectId: firebaseProjectId }
    : { credential: applicationDefault(), projectId: firebaseProjectId }
);
const firestore = getFirestore(app);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const slug = 'roguelike-civilization-rebuilder';
const slugReference = firestore.collection('projectSlugs').doc(slug);
const slugSnapshot = await slugReference.get();
const projectReference = slugSnapshot.exists
  ? firestore.collection('projects').doc(slugSnapshot.data().projectId)
  : firestore.collection('projects').doc();

const sourceDocuments = await firestore.collection('documents').get();
const sourceByPath = new Map(sourceDocuments.docs.map((item) => [item.data().path, item]));

console.log(`Migration target: projects/${projectReference.id}`);
console.log(`Documents: ${manifest.pages.length}; source records: ${sourceDocuments.size}`);
if (dryRun) {
  console.log('Dry run complete. No Firestore writes were performed.');
  process.exit(0);
}

const existingProject = await projectReference.get();
if (!existingProject.exists) {
  const batch = firestore.batch();
  batch.create(projectReference, {
    name: 'Roguelike Civilization Rebuilder',
    slug,
    description: 'The complete game-design knowledge base for Roguelike Civilization Rebuilder.',
    ownerId,
    status: 'active',
    template: 'migrated-game-design',
    documentCount: manifest.pages.length,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    archivedAt: null
  });
  batch.create(slugReference, { projectId: projectReference.id });
  batch.set(projectReference.collection('members').doc(ownerId), {
    role: 'owner',
    addedAt: FieldValue.serverTimestamp()
  });
  batch.set(firestore.collection('platformAdmins').doc(ownerId), {
    createdAt: FieldValue.serverTimestamp()
  });
  await batch.commit();
}

let copied = 0;
let skipped = 0;
for (const descriptor of manifest.pages) {
  const target = projectReference.collection('documents').doc(encodeURIComponent(descriptor.path));
  if ((await target.get()).exists) {
    skipped += 1;
    continue;
  }
  const source = sourceByPath.get(descriptor.path);
  if (!source) {
    throw new Error(`Global source document "${descriptor.path}" is missing.`);
  }
  const sourceData = source.data();
  await target.set({
    path: descriptor.path,
    body: sourceData.body,
    status: descriptor.status,
    summary: descriptor.summary,
    related: descriptor.related,
    order: descriptor.pageIndex,
    version: sourceData.version,
    lastReviewed: sourceData.lastReviewed,
    createdAt: sourceData.createdAt,
    updatedAt: sourceData.updatedAt
  });

  const revisions = await source.ref.collection('revisions').get();
  for (const revision of revisions.docs) {
    await target.collection('revisions').doc(revision.id).set(revision.data());
  }
  copied += 1;
}

const targetCount = (await projectReference.collection('documents').count().get()).data().count;
if (targetCount !== manifest.pages.length) {
  throw new Error(`Verification failed: expected ${manifest.pages.length}, found ${targetCount}.`);
}
console.log(`Migration complete: ${copied} copied, ${skipped} already present, ${targetCount} verified.`);
