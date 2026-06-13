import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.GCLOUD_PROJECT || 'humanization-1c628';
const userId = process.env.MANUSCRIPT_LOCAL_UID || 'editor-user';
const email =
  process.env.MANUSCRIPT_LOCAL_EMAIL || 'norxen.gamedeveloper@gmail.com';
const password =
  process.env.MANUSCRIPT_LOCAL_PASSWORD || 'manuscript-local';

process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST.startsWith('127.0.0.1:')) {
  throw new Error('This command may only target the local Firebase Auth emulator.');
}

const auth = getAuth(initializeApp({ projectId }));

try {
  await auth.getUser(userId);
  await auth.updateUser(userId, {
    email,
    password,
    emailVerified: true,
    displayName: 'Local Manuscript Admin'
  });
  console.log(`Updated local Auth user ${email} (${userId}).`);
} catch (error) {
  if (error?.code !== 'auth/user-not-found') throw error;
  await auth.createUser({
    uid: userId,
    email,
    password,
    emailVerified: true,
    displayName: 'Local Manuscript Admin'
  });
  console.log(`Created local Auth user ${email} (${userId}).`);
}

console.log(`Local login: ${email} / ${password}`);
