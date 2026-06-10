import { Injectable, computed, inject, signal } from '@angular/core';
import type { Auth, User } from 'firebase/auth';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  private authInitialization: Promise<Auth> | null = null;

  readonly user = signal<User | null>(null);
  readonly isEditor = signal(false);
  readonly canChangePassword = computed(
    () => this.user()?.providerData.some((provider) => provider.providerId === 'password') ?? false
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
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
      await signInWithPopup(auth, new GoogleAuthProvider());
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

  async logout(): Promise<void> {
    const auth = await this.initialize();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  }

  private async initializeAuth(): Promise<Auth> {
    const [app, config, authModule] = await Promise.all([
      this.firebase.app(),
      this.firebase.config(),
      import('firebase/auth')
    ]);
    const auth = authModule.getAuth(app);
    await authModule.setPersistence(auth, authModule.browserLocalPersistence);

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

    authModule.onAuthStateChanged(auth, async (user) => {
      this.user.set(user);
      this.isEditor.set(false);
      if (user) {
        try {
          const firestore = await this.firebase.firestore();
          const { doc, getDoc } = await import('firebase/firestore');
          this.isEditor.set(
            (await getDoc(doc(firestore, 'editors', user.uid))).exists()
          );
        } catch {
          this.isEditor.set(false);
        }
      }
      this.ready.set(true);
    });
    return auth;
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
