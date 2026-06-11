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

const projectPath = ['projects', 'project-1'];
const documentPath = [...projectPath, 'documents', 'Index.md'];

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
    const firestore = context.firestore();
    await setDoc(doc(firestore, ...projectPath), {
      name: 'Example Game',
      slug: 'example-game',
      description: 'Public design documentation.',
      ownerId: 'owner-user',
      status: 'active',
      template: 'game-design-v1',
      documentCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null
    });
    await setDoc(doc(firestore, ...projectPath, 'members', 'owner-user'), {
      role: 'owner',
      addedAt: new Date()
    });
    await setDoc(doc(firestore, ...projectPath, 'members', 'editor-user'), {
      role: 'editor',
      addedAt: new Date()
    });
    await setDoc(doc(firestore, 'platformAdmins', 'admin-user'), {
      createdAt: new Date()
    });
    await setDoc(doc(firestore, ...documentPath), {
      path: 'Index.md',
      body: '# Index\n\nOriginal.',
      status: 'draft',
      summary: 'Entry point.',
      related: [],
      order: 0,
      version: 1,
      lastReviewed: '2026-06-11',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
});

after(async () => environment.cleanup());

test('allows public reads of active projects and documents', async () => {
  const firestore = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(firestore, ...projectPath)));
  await assertSucceeds(getDoc(doc(firestore, ...documentPath)));
});

test('denies public reads after a project is archived', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), ...projectPath), { status: 'archived' });
  });
  const firestore = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(firestore, ...projectPath)));
  await assertFails(getDoc(doc(firestore, ...documentPath)));
});

test('allows platform admins to read archived projects', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), ...projectPath), { status: 'archived' });
  });
  const firestore = environment.authenticatedContext('admin-user').firestore();
  await assertSucceeds(getDoc(doc(firestore, ...projectPath)));
  await assertSucceeds(getDoc(doc(firestore, ...documentPath)));
});

test('allows editors to create project documents and update document count', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, ...projectPath, 'documents', 'Systems.md'), {
    path: 'Systems.md',
    body: '# Systems',
    status: 'draft',
    summary: 'Systems overview.',
    related: [],
    order: 1,
    version: 1,
    lastReviewed: '2026-06-11',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(firestore, ...projectPath), {
    documentCount: 2,
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());
});

test('denies project document writes from non-members', async () => {
  const firestore = environment.authenticatedContext('ordinary-user').firestore();
  await assertFails(deleteDoc(doc(firestore, ...documentPath)));
});

test('requires immutable revisions for document saves', async () => {
  const firestore = environment.authenticatedContext('editor-user').firestore();
  await assertFails(updateDoc(doc(firestore, ...documentPath), {
    body: '# Index\n\nChanged.',
    version: 2,
    lastReviewed: '2026-06-11',
    updatedAt: serverTimestamp()
  }));

  const batch = writeBatch(firestore);
  batch.set(doc(firestore, ...documentPath, 'revisions', '1'), {
    path: 'Index.md',
    body: '# Index\n\nOriginal.',
    version: 1,
    lastReviewed: '2026-06-11',
    createdAt: serverTimestamp()
  });
  batch.update(doc(firestore, ...documentPath), {
    body: '# Index\n\nChanged.',
    version: 2,
    lastReviewed: '2026-06-11',
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());
});

test('allows owners to manage editors but not delete owners', async () => {
  const firestore = environment.authenticatedContext('owner-user').firestore();
  await assertSucceeds(setDoc(doc(firestore, ...projectPath, 'members', 'new-editor'), {
    role: 'editor',
    addedAt: serverTimestamp()
  }));
  await assertSucceeds(deleteDoc(doc(firestore, ...projectPath, 'members', 'editor-user')));
  await assertFails(deleteDoc(doc(firestore, ...projectPath, 'members', 'owner-user')));
});

test('allows owners to archive and admins to restore projects', async () => {
  const owner = environment.authenticatedContext('owner-user').firestore();
  await assertSucceeds(updateDoc(doc(owner, ...projectPath), {
    status: 'archived',
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  const admin = environment.authenticatedContext('admin-user').firestore();
  await assertSucceeds(updateDoc(doc(admin, ...projectPath), {
    status: 'active',
    archivedAt: null,
    updatedAt: serverTimestamp()
  }));
});

test('only platform admins can reserve slugs and create projects', async () => {
  const ordinary = environment.authenticatedContext('ordinary-user').firestore();
  await assertFails(setDoc(doc(ordinary, 'projectSlugs', 'new-game'), {
    projectId: 'project-2'
  }));

  const admin = environment.authenticatedContext('admin-user').firestore();
  await assertSucceeds(setDoc(doc(admin, 'projectSlugs', 'new-game'), {
    projectId: 'project-2'
  }));
  const snapshot = await getDoc(doc(admin, 'projectSlugs', 'new-game'));
  assert.equal(snapshot.data().projectId, 'project-2');
});

test('allows a platform admin to create a complete templated project atomically', async () => {
  const firestore = environment.authenticatedContext('admin-user').firestore();
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'projects', 'project-2'), {
    name: 'New Game',
    slug: 'new-game',
    description: 'New design documentation.',
    ownerId: 'admin-user',
    status: 'active',
    template: 'game-design-v1',
    documentCount: 25,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archivedAt: null
  });
  batch.set(doc(firestore, 'projectSlugs', 'new-game'), {
    projectId: 'project-2'
  });
  batch.set(doc(firestore, 'projects', 'project-2', 'members', 'admin-user'), {
    role: 'owner',
    addedAt: serverTimestamp()
  });
  for (let order = 0; order < 25; order += 1) {
    const page = order === 0 ? 'Index.md' : `Page ${order}.md`;
    batch.set(doc(firestore, 'projects', 'project-2', 'documents', encodeURIComponent(page)), {
      path: page,
      body: `# ${page.replace('.md', '')}`,
      status: 'planned',
      summary: 'Template page.',
      related: [],
      order,
      version: 1,
      lastReviewed: '2026-06-11',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  await assertSucceeds(batch.commit());
});

test('allows owners to replace their project slug reservation', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'projectSlugs', 'example-game'), {
      projectId: 'project-1'
    });
  });
  const firestore = environment.authenticatedContext('owner-user').firestore();
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'projectSlugs', 'example-game'));
  batch.set(doc(firestore, 'projectSlugs', 'renamed-game'), {
    projectId: 'project-1'
  });
  batch.update(doc(firestore, ...projectPath), {
    slug: 'renamed-game',
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());
});

test('denies archive restoration by the owner', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), ...projectPath), {
      status: 'archived',
      archivedAt: new Date()
    });
  });
  const firestore = environment.authenticatedContext('owner-user').firestore();
  await assertFails(updateDoc(doc(firestore, ...projectPath), {
    status: 'active',
    archivedAt: null,
    updatedAt: serverTimestamp()
  }));
});

test('transfers ownership while retaining the previous owner as editor', async () => {
  const firestore = environment.authenticatedContext('owner-user').firestore();
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, ...projectPath), {
    ownerId: 'next-owner',
    updatedAt: serverTimestamp()
  });
  batch.set(doc(firestore, ...projectPath, 'members', 'next-owner'), {
    role: 'owner',
    addedAt: serverTimestamp()
  });
  batch.set(doc(firestore, ...projectPath, 'members', 'owner-user'), {
    role: 'editor',
    addedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());
});
