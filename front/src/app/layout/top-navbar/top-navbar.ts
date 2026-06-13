import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Theme } from '../../core/services/theme.service';
import { Project } from '../../core/models/project.model';
import { MentionNotification } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css'
})
export class TopNavbar {
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  readonly notificationsOpen = signal(false);
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

  async openNotification(notification: MentionNotification): Promise<void> {
    this.notificationsOpen.set(false);
    await this.notifications.markRead(notification);
    await this.router.navigate(
      ['/projects', notification.projectId, notification.projectSlug],
      { queryParams: { document: notification.documentPath } }
    );
  }
}
