import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import {
  DOCUMENT_REPOSITORY,
  DocumentRepository
} from './core/repositories/document.repository';
import {
  PROJECT_REPOSITORY,
  ProjectRepository
} from './core/repositories/project.repository';
import { StoredDocument } from './core/models/document-page.model';
import {
  CreateProjectInput,
  Project,
  ProjectMembership,
  ProjectTemplateDocument
} from './core/models/project.model';

const now = new Date('2026-06-11T00:00:00Z');
const project: Project = {
  id: 'project-1',
  name: 'Example Game',
  slug: 'example-game',
  description: 'A public game-design project.',
  ownerId: 'admin-user',
  status: 'active',
  template: 'game-design-v1',
  documentCount: 2,
  createdAt: now,
  updatedAt: now,
  archivedAt: null
};

class FakeAuthService {
  readonly user = signal<any>({
    uid: 'admin-user',
    email: 'admin@example.com',
    providerData: [{ providerId: 'password' }]
  });
  readonly isPlatformAdmin = signal(true);
  readonly canChangePassword = computed(() => true);
  readonly ready = signal(true);
  initialize(): Promise<any> { return Promise.resolve({}); }
  login(): Promise<void> { return Promise.resolve(); }
  loginWithGoogle(): Promise<void> { return Promise.resolve(); }
  changePassword(): Promise<void> { return Promise.resolve(); }
  logout(): Promise<void> { this.user.set(null); return Promise.resolve(); }
}

class MemoryProjectRepository extends ProjectRepository {
  projects = [project];
  archived: Project[] = [];
  members: ProjectMembership[] = [
    { userId: 'admin-user', role: 'owner', addedAt: now }
  ];
  listActive(): Promise<Project[]> { return Promise.resolve([...this.projects]); }
  listArchived(): Promise<Project[]> { return Promise.resolve([...this.archived]); }
  load(projectId: string): Promise<Project> {
    const found = [...this.projects, ...this.archived].find((item) => item.id === projectId);
    return found ? Promise.resolve({ ...found }) : Promise.reject(new Error('Project not found.'));
  }
  isPlatformAdmin(): Promise<boolean> { return Promise.resolve(true); }
  role(): Promise<'owner'> { return Promise.resolve('owner'); }
  create(input: CreateProjectInput, ownerId: string, documents: ProjectTemplateDocument[]): Promise<Project> {
    const created = {
      ...project,
      id: 'project-2',
      ...input,
      ownerId,
      documentCount: documents.length
    };
    this.projects.push(created);
    return Promise.resolve(created);
  }
  update(current: Project, changes: Pick<Project, 'name' | 'slug' | 'description'>): Promise<Project> {
    return Promise.resolve({ ...current, ...changes });
  }
  archive(current: Project): Promise<void> {
    this.projects = this.projects.filter((item) => item.id !== current.id);
    this.archived.push({ ...current, status: 'archived' });
    return Promise.resolve();
  }
  restore(current: Project): Promise<void> {
    this.archived = this.archived.filter((item) => item.id !== current.id);
    this.projects.push({ ...current, status: 'active' });
    return Promise.resolve();
  }
  listMembers(): Promise<ProjectMembership[]> { return Promise.resolve([...this.members]); }
  addEditor(_projectId: string, userId: string): Promise<void> {
    this.members.push({ userId, role: 'editor', addedAt: now });
    return Promise.resolve();
  }
  removeEditor(_projectId: string, userId: string): Promise<void> {
    this.members = this.members.filter((member) => member.userId !== userId);
    return Promise.resolve();
  }
  transferOwnership(): Promise<void> { return Promise.resolve(); }
}

class MemoryDocumentRepository extends DocumentRepository {
  documents: StoredDocument[] = [
    {
      path: 'Index.md',
      body: '# Index\n\nWelcome.',
      status: 'draft',
      summary: 'Project entry point.',
      related: ['Systems.md'],
      order: 0,
      version: 1,
      lastReviewed: '2026-06-11',
      createdAt: now,
      updatedAt: now
    },
    {
      path: 'Systems.md',
      body: '# Systems\n\nSystem overview.',
      status: 'planned',
      summary: 'System overview.',
      related: [],
      order: 1,
      version: 1,
      lastReviewed: '2026-06-11',
      createdAt: now,
      updatedAt: now
    }
  ];
  list(): Promise<StoredDocument[]> { return Promise.resolve(this.documents.map((item) => ({ ...item }))); }
  load(_projectId: string, path: string): Promise<StoredDocument> {
    const found = this.documents.find((item) => item.path === path);
    return found ? Promise.resolve({ ...found }) : Promise.reject(new Error('Missing document.'));
  }
  create(_projectId: string, path: string, body: string, order: number): Promise<StoredDocument> {
    const created: StoredDocument = {
      path, body, order, status: 'draft', summary: 'New documentation page.',
      related: [], version: 1, lastReviewed: '2026-06-11', createdAt: now, updatedAt: now
    };
    this.documents.push(created);
    return Promise.resolve({ ...created });
  }
  delete(_projectId: string, path: string): Promise<void> {
    this.documents = this.documents.filter((item) => item.path !== path);
    return Promise.resolve();
  }
  save(_projectId: string, path: string, body: string, expectedVersion: number): Promise<StoredDocument> {
    const found = this.documents.find((item) => item.path === path)!;
    const saved = { ...found, body, version: expectedVersion + 1, updatedAt: now };
    this.documents = this.documents.map((item) => item.path === path ? saved : item);
    return Promise.resolve(saved);
  }
}

describe('multi-project Manuscript', () => {
  let projectRepository: MemoryProjectRepository;
  let documentRepository: MemoryDocumentRepository;

  beforeEach(async () => {
    localStorage.clear();
    projectRepository = new MemoryProjectRepository();
    documentRepository = new MemoryDocumentRepository();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: new FakeAuthService() },
        { provide: PROJECT_REPOSITORY, useValue: projectRepository },
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepository }
      ]
    }).compileComponents();
  });

  it('renders the project lobby as the application entry point', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.project-card')).toBeTruthy();
    });

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Choose a project');
    expect(fixture.nativeElement.querySelector('.project-card')?.textContent).toContain('Example Game');
  });

  it('opens a project workspace with its Firestore document tree', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/projects/project-1/example-game');
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(2);
    });

    expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Index');
    expect(fixture.nativeElement.textContent).toContain('Project entry point.');
  });

  it('corrects stale decorative slugs', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/projects/project-1/old-name');
    fixture.detectChanges();
    await vi.waitFor(() => expect(router.url).toBe('/projects/project-1/example-game'));

    expect(router.url).toBe('/projects/project-1/example-game');
  });

  it('creates projects from the complete generic template', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.hero-actions .primary')).toBeTruthy();
    });

    (fixture.nativeElement.querySelector('.hero-actions .primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('.project-modal input');
    inputs[0].value = 'Second Game';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'second-game';
    inputs[1].dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('form.project-modal') as HTMLFormElement)
      .dispatchEvent(new Event('submit'));
    await vi.waitFor(() => expect(router.url).toBe('/projects/project-2/second-game'));

    expect(projectRepository.projects.at(-1)?.documentCount).toBe(25);
    expect(router.url).toBe('/projects/project-2/second-game');
  });

  it('scopes editor drafts by project ID', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/projects/project-1/example-game');
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
    });

    (fixture.nativeElement.querySelector('.edit-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      'textarea[aria-label="Markdown document body"]'
    ) as HTMLTextAreaElement;
    textarea.value = '# Index\n\nDraft.';
    textarea.dispatchEvent(new Event('input'));

    expect(localStorage.getItem('manuscript-draft:project-1:Index.md')).toContain('Draft.');
  });
});
