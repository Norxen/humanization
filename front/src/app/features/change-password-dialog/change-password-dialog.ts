import { Component, inject, output, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.html',
  styleUrl: '../login-dialog/login-dialog.css'
})
export class ChangePasswordDialog {
  private readonly auth = inject(AuthService);

  readonly closed = output<void>();
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmation = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.newPassword().length < 6) {
      this.error.set('The new password must contain at least 6 characters.');
      return;
    }
    if (this.newPassword() !== this.confirmation()) {
      this.error.set('The new passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.changePassword(this.currentPassword(), this.newPassword());
      this.closed.emit();
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Unable to change the password.'
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
