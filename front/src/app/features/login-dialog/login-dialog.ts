import { Component, inject, output, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.css'
})
export class LoginDialog {
  private readonly auth = inject(AuthService);

  readonly closed = output<void>();
  readonly email = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  closeFromBackdrop(event: PointerEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.email().trim() || !this.password()) {
      this.error.set('Enter your email and password.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email(), this.password());
      this.password.set('');
      this.closed.emit();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitGoogle(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.loginWithGoogle();
      this.closed.emit();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      this.submitting.set(false);
    }
  }
}
