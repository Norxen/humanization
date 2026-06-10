import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test, { after, before, beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(directory, '..');
const projectId = 'manuscript-rules-test';
const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] ?? '127.0.0.1';
const port = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] ?? 8080);
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port,
      rules: await readFile(path.join(projectDirectory, 'firestore.rules'), 'utf8')
    }
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'documents', 'Vision.md'), {
      path: 'Vision.md',
      body: '# Vision\n\nOriginal.',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: new Date('2026-06-09T00:00:00Z'),
      updatedAt: new Date('2026-06-09T00:00:00Z')
    });
    await setDoc(doc(context.firestore(), 'editors', 'editor-user'), {
      email: 'editor@example.com'
    });
  });
});

after(async () => {
  await environment.cleanup();
});

test('allows public reads', async () => {
  const firestore = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(firestore, 'documents', 'Vision.md')));
});

test('allows users to read only their own editor authorization', async () => {
  const editor = environment.authenticatedContext('editor-user').firestore();
  const ordinary = environment.authenticatedContext('ordinary-user').firestore();
  await assertSucceeds(getDoc(doc(editor, 'editors', 'editor-user')));
  await assertFails(getDoc(doc(ordinary, 'editors', 'editor-user')));
  await assertFails(
    setDoc(doc(editor, 'editors', 'another-user'), {
      email: 'another@example.com'
    })
  );
});

test('denies unauthenticated writes', async () => {
  const firestore = environment.unauthenticatedContext().firestore();
  await assertFails(
    setDoc(doc(firestore, 'documents', 'New.md'), {
      path: 'New.md',
      body: '# New',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  );
  await assertFails(deleteDoc(doc(firestore, 'documents', 'Vision.md')));
});

test('denies authenticated users who are not editors', async () => {
  const firestore = environment.authenticatedContext('ordinary-user').firestore();
  await assertFails(
    setDoc(doc(firestore, 'documents', 'Unauthorized.md'), {
      path: 'Unauthorized.md',
      body: '# Unauthorized',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  );
  await assertFails(deleteDoc(doc(firestore, 'documents', 'Vision.md')));
});

test('allows authenticated creation and document deletion', async () => {
  const firestore = environment
    .authenticatedContext('editor-user', { email: 'editor@example.com' })
    .firestore();
  await assertSucceeds(
    setDoc(doc(firestore, 'documents', 'New.md'), {
      path: 'New.md',
      body: '# New',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  );
  await assertSucceeds(deleteDoc(doc(firestore, 'documents', 'Vision.md')));
});

test('denies malformed document creation', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  await assertFails(
    setDoc(doc(firestore, 'documents', 'Invalid.md'), {
      path: 'Invalid',
      body: '# Invalid',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  );
  await assertFails(
    setDoc(doc(firestore, 'documents', 'WrongVersion.md'), {
      path: 'WrongVersion.md',
      body: '# Wrong Version',
      version: 2,
      lastReviewed: '2026-06-09',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  );
});

test('requires an immutable revision and a one-step version update', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  const reference = doc(firestore, 'documents', 'Vision.md');
  await assertFails(
    updateDoc(reference, {
      body: '# Vision\n\nChanged.',
      version: 2,
      lastReviewed: '2026-06-09',
      updatedAt: serverTimestamp()
    })
  );

  const batch = writeBatch(firestore);
  batch.set(doc(reference, 'revisions', '1'), {
    path: 'Vision.md',
    body: '# Vision\n\nOriginal.',
    version: 1,
    lastReviewed: '2026-06-09',
    createdAt: serverTimestamp()
  });
  batch.update(reference, {
    body: '# Vision\n\nChanged.',
    version: 2,
    lastReviewed: '2026-06-09',
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());
});

test('denies immutable field changes and oversized bodies', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  const reference = doc(firestore, 'documents', 'Vision.md');

  const pathBatch = writeBatch(firestore);
  pathBatch.set(doc(reference, 'revisions', '1'), {
    path: 'Vision.md',
    body: '# Vision\n\nOriginal.',
    version: 1,
    lastReviewed: '2026-06-09',
    createdAt: serverTimestamp()
  });
  pathBatch.update(reference, {
    path: 'Changed.md',
    body: '# Vision\n\nChanged.',
    version: 2,
    lastReviewed: '2026-06-09',
    updatedAt: serverTimestamp()
  });
  await assertFails(pathBatch.commit());

  const sizeBatch = writeBatch(firestore);
  sizeBatch.set(doc(reference, 'revisions', '1'), {
    path: 'Vision.md',
    body: '# Vision\n\nOriginal.',
    version: 1,
    lastReviewed: '2026-06-09',
    createdAt: serverTimestamp()
  });
  sizeBatch.update(reference, {
    body: `# Vision\n\n${'x'.repeat(512001)}`,
    version: 2,
    lastReviewed: '2026-06-09',
    updatedAt: serverTimestamp()
  });
  await assertFails(sizeBatch.commit());
});

test('revision documents are immutable', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'documents', 'Vision.md', 'revisions', '1'), {
      path: 'Vision.md',
      body: '# Vision\n\nOriginal.',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: new Date('2026-06-09T00:00:00Z')
    });
  });

  const revision = doc(firestore, 'documents', 'Vision.md', 'revisions', '1');
  await assertFails(updateDoc(revision, { body: 'Changed' }));
  await assertFails(deleteDoc(revision));
  assert.equal((await getDoc(revision)).data().body, '# Vision\n\nOriginal.');
});

test('allows revision deletion only with its parent document', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'documents', 'Vision.md', 'revisions', '1'), {
      path: 'Vision.md',
      body: '# Vision\n\nOriginal.',
      version: 1,
      lastReviewed: '2026-06-09',
      createdAt: new Date('2026-06-09T00:00:00Z')
    });
  });

  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'documents', 'Vision.md', 'revisions', '1'));
  batch.delete(doc(firestore, 'documents', 'Vision.md'));
  await assertSucceeds(batch.commit());
});
