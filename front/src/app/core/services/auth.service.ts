import { Injectable, computed, inject, signal } from '@angular/core';
import type { Auth, User } from 'firebase/auth';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  private authInitialization: Promise<Auth> | null = null;
  private userGeneration = 0;

  readonly user = signal<User | null>(null);
  readonly isPlatformAdmin = signal(false);
  readonly canChangePassword = computed(
    () => this.user()?.providerData.some((provider) => provider.providerId === 'password') ?? false
  );
  readonly canSetPassword = computed(
    () => Boolean(this.user()?.email) && !this.canChangePassword()
  );
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);

  initialize(): Promise<Auth> {
    this.authInitialization ??= this.initializeAuth();
    return this.authInitialization;
  }

  async login(email: string, password: string): Promise<void> {
    this.error.set(null);
    try {
      const auth = await this.initialize();
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await this.applyUser(credential.user);
    } catch (error) {
      const message = this.authErrorMessage(error);
      this.error.set(message);
      throw new Error(message);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.error.set(null);
    try {
      const auth = await this.initialize();
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await this.applyUser(credential.user);
    } catch (error) {
      const message = this.authErrorMessage(error);
      this.error.set(message);
      throw new Error(message);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.user();
    if (!user?.email || !this.canChangePassword()) {
      throw new Error('This account does not use an email/password credential.');
    }

    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
        await import('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String(error.code)
          : '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'
      ) {
        throw new Error('The current password is incorrect.');
      }
      if (code === 'auth/weak-password') {
        throw new Error('The new password does not meet Firebase requirements.');
      }
      if (code === 'auth/requires-recent-login') {
        throw new Error('Sign out and sign in again before changing the password.');
      }
      throw new Error('Unable to change the password.');
    }
  }

  async setPassword(newPassword: string): Promise<void> {
    const user = this.user();
    if (!user?.email || !this.canSetPassword()) {
      throw new Error('This account already has a password credential.');
    }

    try {
      const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
      await linkWithCredential(
        user,
        EmailAuthProvider.credential(user.email, newPassword)
      );
      await user.reload();
      this.user.set(null);
      this.user.set(user);
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String(error.code)
          : '';
      if (code === 'auth/weak-password') {
        throw new Error('The password does not meet Firebase requirements.');
      }
      if (
        code === 'auth/provider-already-linked' ||
        code === 'auth/email-already-in-use' ||
        code === 'auth/credential-already-in-use'
      ) {
        throw new Error('This email already has a password credential.');
      }
      if (code === 'auth/requires-recent-login') {
        throw new Error('Sign out and sign in with Google again before setting a password.');
      }
      throw new Error('Unable to set the password.');
    }
  }

  async logout(): Promise<void> {
    const auth = await this.initialize();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    await this.applyUser(null);
  }

  private async initializeAuth(): Promise<Auth> {
    const [app, config, authModule] = await Promise.all([
      this.firebase.app(),
      this.firebase.config(),
      import('firebase/auth')
    ]);
    const auth = authModule.getAuth(app);

    if (
      config.emulator?.enabled &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ) {
      authModule.connectAuthEmulator(
        auth,
        `http://${config.emulator.host || '127.0.0.1'}:${config.emulator.authPort || 9099}`,
        { disableWarnings: true }
      );
    }

    await authModule.setPersistence(auth, authModule.browserLocalPersistence);

    await new Promise<void>((resolve) => {
      let initialized = false;
      authModule.onAuthStateChanged(auth, async (user) => {
        await this.applyUser(user);
        this.ready.set(true);
        if (!initialized) {
          initialized = true;
          resolve();
        }
      });
    });
    return auth;
  }

  private async applyUser(user: User | null): Promise<void> {
    const generation = ++this.userGeneration;
    this.user.set(user);
    this.isPlatformAdmin.set(false);
    if (!user) return;

    try {
      const firestore = await this.firebase.firestore();
      const { doc, getDoc } = await import('firebase/firestore');
      const isAdmin = (await getDoc(doc(firestore, 'platformAdmins', user.uid))).exists();
      if (generation === this.userGeneration && this.user()?.uid === user.uid) {
        this.isPlatformAdmin.set(isAdmin);
      }
    } catch {
      if (generation === this.userGeneration) this.isPlatformAdmin.set(false);
    }
  }

  private authErrorMessage(error: unknown): string {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String(error.code)
        : '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'The email or password is incorrect.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Wait before trying again.';
      case 'auth/network-request-failed':
        return 'Authentication could not reach Firebase.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'The browser blocked the Google sign-in popup.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using another sign-in method.';
      default:
        return 'Unable to sign in.';
    }
  }
}
