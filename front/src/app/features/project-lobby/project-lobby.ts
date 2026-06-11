import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectStore } from '../../core/services/project-store.service';
import { ThemeService } from '../../core/services/theme.service';
import { TopNavbar } from '../../layout/top-navbar/top-navbar';
import { LoginDialog } from '../login-dialog/login-dialog';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';

@Component({
  selector: 'app-project-lobby',
  imports: [TopNavbar, LoginDialog, ChangePasswordDialog],
  templateUrl: './project-lobby.html',
  styleUrl: './project-lobby.css'
})
export class ProjectLobby implements OnInit {
  readonly projects = inject(ProjectStore);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly loginOpen = signal(false);
  readonly passwordOpen = signal(false);
  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly showArchived = signal(false);
  readonly routeError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.routeError.set(window.history.state?.projectError ?? null);
    await this.auth.initialize();
    await this.projects.loadLobby();
  }

  open(projectId: string, slug: string): void {
    void this.router.navigate(['/projects', projectId, slug]);
  }

  async create(name: string, slug: string, description: string): Promise<void> {
    this.creating.set(true);
    this.createError.set(null);
    try {
      const project = await this.projects.create({ name, slug, description });
      this.createOpen.set(false);
      this.open(project.id, project.slug);
    } catch (error) {
      this.createError.set(error instanceof Error ? error.message : 'Unable to create project.');
    } finally {
      this.creating.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.projects.loadLobby();
  }

  closeCreateFromBackdrop(event: PointerEvent): void {
    if (event.target === event.currentTarget) {
      this.createOpen.set(false);
    }
  }
}
