import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import {
  CreateProjectInput,
  Project,
  ProjectMembership
} from '../models/project.model';
import { PROJECT_REPOSITORY } from '../repositories/project.repository';
import { GAME_DESIGN_TEMPLATE } from '../data/game-design-template';

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly repository = inject(PROJECT_REPOSITORY);
  private readonly auth = inject(AuthService);

  readonly projects = signal<Project[]>([]);
  readonly archivedProjects = signal<Project[]>([]);
  readonly activeProject = signal<Project | null>(null);
  readonly members = signal<ProjectMembership[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeRole = signal<'owner' | 'editor' | 'admin' | null>(null);
  readonly roles = signal<Partial<Record<string, 'owner' | 'editor' | 'admin'>>>({});

  readonly canCreate = computed(() => this.auth.isPlatformAdmin());
  readonly canManageActive = computed(
    () => this.activeProject()?.status === 'active'
      && (this.activeRole() === 'owner' || this.activeRole() === 'admin')
  );
  readonly canEditActive = computed(
    () => this.activeProject()?.status === 'active' && this.activeRole() !== null
  );

  async loadLobby(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.projects.set(await this.repository.listActive());
      const userId = this.auth.user()?.uid;
      if (this.auth.isPlatformAdmin()) {
        this.roles.set(
          Object.fromEntries(this.projects().map((project) => [project.id, 'admin']))
        );
      } else if (userId) {
        const roles = await Promise.all(
          this.projects().map(async (project) => [
            project.id,
            await this.repository.role(project.id, userId)
          ] as const)
        );
        this.roles.set(
          Object.fromEntries(roles.filter((entry) => entry[1] !== null)) as Record<
            string,
            'owner' | 'editor'
          >
        );
      } else {
        this.roles.set({});
      }
      if (this.auth.isPlatformAdmin()) {
        this.archivedProjects.set(await this.repository.listArchived());
      } else {
        this.archivedProjects.set([]);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load projects.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadProject(projectId: string): Promise<Project> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const project = await this.repository.load(projectId);
      this.activeProject.set(project);
      const userId = this.auth.user()?.uid;
      if (userId && this.auth.isPlatformAdmin()) {
        this.activeRole.set('admin');
      } else if (userId) {
        this.activeRole.set(await this.repository.role(projectId, userId));
      } else {
        this.activeRole.set(null);
      }
      if (this.activeRole() !== null) {
        this.members.set(await this.repository.listMembers(projectId));
      } else {
        this.members.set([]);
      }
      return project;
    } finally {
      this.loading.set(false);
    }
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const userId = this.requireUser();
    const project = await this.repository.create(
      { ...input, slug: this.normalizeSlug(input.slug || input.name) },
      userId,
      GAME_DESIGN_TEMPLATE
    );
    await this.loadLobby();
    return project;
  }

  async update(changes: Pick<Project, 'name' | 'slug' | 'description'>): Promise<Project> {
    const project = this.requireProject();
    const updated = await this.repository.update(project, {
      ...changes,
      slug: this.normalizeSlug(changes.slug)
    });
    this.activeProject.set(updated);
    return updated;
  }

  async archive(): Promise<void> {
    await this.repository.archive(this.requireProject());
    await this.loadLobby();
  }

  async restore(project: Project): Promise<void> {
    await this.repository.restore(project);
    await this.loadLobby();
  }

  async addEditor(userId: string): Promise<void> {
    const project = this.requireProject();
    await this.repository.addEditor(project.id, userId.trim());
    this.members.set(await this.repository.listMembers(project.id));
  }

  async removeEditor(userId: string): Promise<void> {
    const project = this.requireProject();
    await this.repository.removeEditor(project.id, userId);
    this.members.set(await this.repository.listMembers(project.id));
  }

  async transferOwnership(userId: string): Promise<void> {
    const project = this.requireProject();
    await this.repository.transferOwnership(project, userId.trim());
    await this.loadProject(project.id);
  }

  normalizeSlug(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (slug.length < 3 || slug.length > 80) {
      throw new Error('Project slug must contain between 3 and 80 characters.');
    }
    return slug;
  }

  private requireUser(): string {
    const userId = this.auth.user()?.uid;
    if (!userId) {
      throw new Error('Sign in before managing projects.');
    }
    return userId;
  }

  private requireProject(): Project {
    const project = this.activeProject();
    if (!project) {
      throw new Error('No project is active.');
    }
    return project;
  }
}
