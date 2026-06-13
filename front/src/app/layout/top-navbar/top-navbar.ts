import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Theme } from '../../core/services/theme.service';
import { Project } from '../../core/models/project.model';
import { MentionNotification } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css'
})
export class TopNavbar {
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly toasts = inject(ToastService);
  readonly notificationsOpen = signal(false);
  readonly markingAllRead = signal(false);
  readonly theme = input.required<Theme>();
  readonly userEmail = input<string | null>(null);
  readonly authReady = input(false);
  readonly canChangePassword = input(false);
  readonly canSetPassword = input(false);
  readonly projectName = input('Projects');
  readonly showBack = input(false);
  readonly canManageProject = input(false);
  readonly projectOptions = input<Project[]>([]);
  readonly activeProjectId = input<string | null>(null);
  readonly menuToggle = output<void>();
  readonly themeToggle = output<void>();
  readonly login = output<void>();
  readonly passwordChange = output<void>();
  readonly logout = output<void>();
  readonly back = output<void>();
  readonly projectSettings = output<void>();
  readonly projectSelected = output<Project>();

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  async markAllNotificationsRead(): Promise<void> {
    if (this.markingAllRead()) return;
    this.markingAllRead.set(true);
    try {
      await this.notifications.markAllRead();
      this.toasts.success('Notifications marked as read.');
    } catch {
      this.toasts.error('Unable to update notifications.');
    } finally {
      this.markingAllRead.set(false);
    }
  }

  async openNotification(notification: MentionNotification): Promise<void> {
    this.notificationsOpen.set(false);
    try {
      await this.notifications.markRead(notification);
    } catch {
      this.toasts.error('The notification could not be marked as read.');
    }
    await this.router.navigate(
      ['/projects', notification.projectId, notification.projectSlug],
      { queryParams: { document: notification.documentPath } }
    );
  }

  @HostListener('document:pointerdown', ['$event'])
  closeNotificationsOutside(event: PointerEvent): void {
    if (
      this.notificationsOpen()
      && !(event.target instanceof Node && this.host.nativeElement.querySelector('.notification-center')?.contains(event.target))
    ) {
      this.notificationsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeNotificationsOnEscape(): void {
    this.notificationsOpen.set(false);
  }
}
