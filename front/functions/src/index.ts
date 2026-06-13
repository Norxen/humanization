import { createHash } from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

if (!getApps().length) initializeApp();

interface ProjectDocument {
  path: string;
  body: string;
  version: number;
  updatedBy?: string;
}

export function extractMentions(body: string): Set<string> {
  const mentions = new Set<string>();
  for (const match of body.matchAll(/(^|[^\w])@([A-Za-z0-9_-]{1,128})\b/g)) {
    mentions.add(match[2]);
  }
  return mentions;
}

export function newMentions(previousBody: string, nextBody: string): string[] {
  const previous = extractMentions(previousBody);
  return [...extractMentions(nextBody)].filter((userId) => !previous.has(userId));
}

export function eligibleMentions(
  previousBody: string,
  nextBody: string,
  actorId: string,
  memberIds: Iterable<string>
): string[] {
  const members = new Set(memberIds);
  return newMentions(previousBody, nextBody)
    .filter((userId) => userId !== actorId && members.has(userId));
}

export function notificationId(
  projectId: string,
  documentPath: string,
  version: number,
  recipientId: string
): string {
  return createHash('sha256')
    .update(`${projectId}\0${documentPath}\0${version}\0${recipientId}`)
    .digest('hex');
}

export const notifyDocumentMentions = onDocumentWritten(
  {
    document: 'projects/{projectId}/documents/{documentId}',
    region: 'europe-west1'
  },
  async (event) => {
    const afterSnapshot = event.data?.after;
    if (!afterSnapshot?.exists) return;

    const after = afterSnapshot.data() as ProjectDocument;
    const before = event.data?.before.exists
      ? event.data.before.data() as ProjectDocument
      : null;
    const actorId = after.updatedBy;
    if (!actorId) return;

    const candidates = newMentions(before?.body ?? '', after.body)
      .filter((userId) => userId !== actorId);
    if (!candidates.length) return;

    const firestore = getFirestore();
    const projectId = event.params.projectId;
    const projectReference = firestore.doc(`projects/${projectId}`);
    const projectSnapshot = await projectReference.get();
    if (!projectSnapshot.exists || projectSnapshot.get('status') !== 'active') return;

    const memberReferences = candidates.map((userId) =>
      firestore.doc(`projects/${projectId}/members/${userId}`)
    );
    const memberSnapshots = await firestore.getAll(...memberReferences);
    const validRecipients = eligibleMentions(
      before?.body ?? '',
      after.body,
      actorId,
      memberSnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.id)
    );
    if (!validRecipients.length) return;

    const project = projectSnapshot.data()!;
    const title = after.path.split('/').at(-1)?.replace(/\.md$/i, '') ?? after.path;
    const batch = firestore.batch();
    for (const recipientId of validRecipients) {
      const id = notificationId(projectId, after.path, after.version, recipientId);
      const reference = firestore.doc(`users/${recipientId}/notifications/${id}`);
      batch.set(reference, {
        type: 'mention',
        recipientId,
        actorId,
        projectId,
        projectName: project['name'],
        projectSlug: project['slug'],
        documentPath: after.path,
        documentTitle: title,
        documentVersion: after.version,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
        readAt: null
      });
    }
    await batch.commit();
  }
);
