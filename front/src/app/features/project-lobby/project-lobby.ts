import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectStore } from '../../core/services/project-store.service';
import { ThemeService } from '../../core/services/theme.service';
import { TopNavbar } from '../../layout/top-navbar/top-navbar';
import { LoginDialog } from '../login-dialog/login-dialog';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';
import { Modal } from '../../shared/modal/modal';
import { ToastService } from '../../core/services/toast.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-project-lobby',
  imports: [TopNavbar, LoginDialog, ChangePasswordDialog, Modal, RouterLink],
  templateUrl: './project-lobby.html',
  styleUrl: './project-lobby.css'
})
export class ProjectLobby implements OnInit {
  readonly projects = inject(ProjectStore);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly loginOpen = signal(false);
  readonly passwordOpen = signal(false);
  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createName = signal('');
  readonly createSlug = signal('');
  readonly createDescription = signal('');
  readonly restoring = signal<string | null>(null);
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

  openCreate(): void {
    this.createName.set('');
    this.createSlug.set('');
    this.createDescription.set('');
    this.createError.set(null);
    this.createOpen.set(true);
  }

  async create(): Promise<void> {
    this.creating.set(true);
    this.createError.set(null);
    try {
      const project = await this.projects.create({
        name: this.createName(),
        slug: this.createSlug(),
        description: this.createDescription()
      });
      this.createOpen.set(false);
      this.toasts.success('Project created.');
      this.open(project.id, project.slug);
    } catch (error) {
      this.createError.set(error instanceof Error ? error.message : 'Unable to create project.');
    } finally {
      this.creating.set(false);
    }
  }

  async restore(project: Project): Promise<void> {
    this.restoring.set(project.id);
    try {
      await this.projects.restore(project);
      this.toasts.success('Project restored.');
    } catch (error) {
      this.toasts.error(error instanceof Error ? error.message : 'Unable to restore project.');
    } finally {
      this.restoring.set(null);
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.projects.loadLobby();
  }

  async refreshAccessAfterLogin(): Promise<void> {
    this.loginOpen.set(false);
    await this.projects.loadLobby();
    this.changeDetector.markForCheck();
  }

}
