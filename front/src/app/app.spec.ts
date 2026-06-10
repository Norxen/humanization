import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentationManifest } from './core/models/document-page.model';
import { App } from './app';
import {
  DOCUMENT_REPOSITORY,
  DocumentConflictError,
  DocumentRepository
} from './core/repositories/document.repository';
import { StoredDocument } from './core/models/document-page.model';
import { AuthService } from './core/services/auth.service';

class FakeAuthService {
  readonly user = signal<{ email: string; providerData: { providerId: string }[] } | null>({
    email: 'editor@example.com',
    providerData: [{ providerId: 'password' }]
  });
  readonly isEditor = signal(true);
  readonly canChangePassword = computed(
    () => this.user()?.providerData.some((provider) => provider.providerId === 'password') ?? false
  );
  readonly ready = signal(true);
  readonly error = signal<string | null>(null);

  initialize(): Promise<never> {
    return Promise.resolve(undefined as never);
  }

  login(email: string, password: string): Promise<void> {
    if (email === 'editor@example.com' && password === 'correct-password') {
      this.user.set({ email, providerData: [{ providerId: 'password' }] });
      this.isEditor.set(true);
      return Promise.resolve();
    }
    return Promise.reject(new Error('The email or password is incorrect.'));
  }

  loginWithGoogle(): Promise<void> {
    this.user.set({
      email: 'google@example.com',
      providerData: [{ providerId: 'google.com' }]
    });
    this.isEditor.set(true);
    return Promise.resolve();
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (currentPassword !== 'correct-password') {
      return Promise.reject(new Error('The current password is incorrect.'));
    }
    if (newPassword.length < 6) {
      return Promise.reject(new Error('Weak password.'));
    }
    return Promise.resolve();
  }

  logout(): Promise<void> {
    this.user.set(null);
    this.isEditor.set(false);
    return Promise.resolve();
  }
}

class MemoryDocumentRepository extends DocumentRepository {
  forceConflict = false;
  readonly documents = new Map<string, StoredDocument>([
    [
      'index.md',
      {
        path: 'index.md',
        body: `# Index

Read the [Story Brief](storytelling.md).

\`\`\`plantuml
@startuml
Alice -> Bob: Hello
@enduml
\`\`\``,
        version: 1,
        lastReviewed: '2026-06-07',
        createdAt: new Date('2026-06-07T00:00:00Z'),
        updatedAt: new Date('2026-06-07T00:00:00Z')
      }
    ],
    [
      'storytelling.md',
      {
        path: 'storytelling.md',
        body: `# Story Brief

The narrative foundation.`,
        version: 3,
        lastReviewed: '2026-06-06',
        createdAt: new Date('2026-06-06T00:00:00Z'),
        updatedAt: new Date('2026-06-06T00:00:00Z')
      }
    ]
  ]);

  list(): Promise<StoredDocument[]> {
    return Promise.resolve([...this.documents.values()].map((document) => ({ ...document })));
  }

  load(path: string): Promise<StoredDocument> {
    const document = this.documents.get(path);
    return document
      ? Promise.resolve({ ...document })
      : Promise.reject(new Error(`Missing ${path}`));
  }

  create(path: string, body: string): Promise<StoredDocument> {
    if (this.documents.has(path)) {
      return Promise.reject(new Error(`A document already exists at "${path}".`));
    }
    const created: StoredDocument = {
      path,
      body,
      version: 1,
      lastReviewed: '2026-06-10',
      createdAt: new Date('2026-06-10T00:00:00Z'),
      updatedAt: new Date('2026-06-10T00:00:00Z')
    };
    this.documents.set(path, created);
    return Promise.resolve({ ...created });
  }

  delete(path: string): Promise<void> {
    this.documents.delete(path);
    return Promise.resolve();
  }

  save(path: string, body: string, expectedVersion: number): Promise<StoredDocument> {
    const current = this.documents.get(path);
    if (this.forceConflict && current) {
      return Promise.reject(
        new DocumentConflictError({
          ...current,
          body: '# Index\n\nChanged elsewhere.',
          version: current.version + 1
        })
      );
    }
    if (!current || current.version !== expectedVersion) {
      return Promise.reject(new Error('Version conflict'));
    }
    const saved = {
      ...current,
      body,
      version: current.version + 1,
      lastReviewed: '2026-06-09',
      updatedAt: new Date('2026-06-09T00:00:00Z')
    };
    this.documents.set(path, saved);
    return Promise.resolve({ ...saved });
  }
}

let repository: MemoryDocumentRepository;
let auth: FakeAuthService;

const manifest: DocumentationManifest = {
  name: 'game-design',
  generatedAt: '2026-06-07T00:00:00.000Z',
  nodes: [
    {
      id: 'index.md',
      name: 'Index.md',
      displayName: 'Index',
      displayPath: ['Index'],
      title: 'Index',
      type: 'markdown',
      path: 'index.md',
      assetUrl: 'docs/game-design/index.md',
      pageIndex: 0,
      status: 'draft',
      lastReviewed: '2026-06-07',
      summary: 'Entry point for the game design.',
      related: ['storytelling.md']
    },
    {
      id: 'storytelling.md',
      name: 'Storytelling.md',
      displayName: 'Storytelling',
      displayPath: ['Storytelling'],
      title: 'Story Brief',
      type: 'folder',
      path: 'storytelling.md',
      assetUrl: 'docs/game-design/storytelling.md',
      pageIndex: 1,
      status: 'review',
      lastReviewed: '2026-06-06',
      summary: 'Narrative foundation.',
      related: ['index.md'],
      children: []
    }
  ],
  pages: [
    {
      id: 'index.md',
      name: 'Index.md',
      displayName: 'Index',
      displayPath: ['Index'],
      title: 'Index',
      path: 'index.md',
      assetUrl: 'docs/game-design/index.md',
      pageIndex: 0,
      status: 'draft',
      lastReviewed: '2026-06-07',
      summary: 'Entry point for the game design.',
      related: ['storytelling.md']
    },
    {
      id: 'storytelling.md',
      name: 'Storytelling.md',
      displayName: 'Storytelling',
      displayPath: ['Storytelling'],
      title: 'Story Brief',
      path: 'storytelling.md',
      assetUrl: 'docs/game-design/storytelling.md',
      pageIndex: 1,
      status: 'review',
      lastReviewed: '2026-06-06',
      summary: 'Narrative foundation.',
      related: ['index.md']
    }
  ]
};

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    repository = new MemoryDocumentRepository();
    auth = new FakeAuthService();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith('manifest.json')) {
          return new Response(JSON.stringify(manifest), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response('Not found', { status: 404 });
      })
    );

    await TestBed.configureTestingModule({
      imports: [App]
    })
      .overrideProvider(DOCUMENT_REPOSITORY, {
        useValue: repository
      })
      .overrideProvider(AuthService, {
        useValue: auth
      })
      .compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show read-only controls while signed out and allow login', async () => {
    auth.user.set(null);
    auth.isEditor.set(false);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.auth-button')?.textContent).toContain(
        'Login'
      );
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeNull();
      expect(fixture.nativeElement.querySelector('.add-root')).toBeNull();
    });

    fixture.nativeElement.querySelector('.auth-button').click();
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('.login-dialog input');
    inputs[0].value = 'editor@example.com';
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].value = 'correct-password';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('.login-dialog form') as HTMLFormElement)
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(auth.user()?.email).toBe('editor@example.com');
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.login-dialog')).toBeNull();
    });
  });

  it('should sign in with Google and hide password changes for Google-only accounts', async () => {
    auth.user.set(null);
    auth.isEditor.set(false);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.auth-button')).toBeTruthy();
    });
    fixture.nativeElement.querySelector('.auth-button').click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.google-login') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(auth.user()?.email).toBe('google@example.com');
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.meta')?.textContent).not.toContain(
        'Password'
      );
    });
  });

  it('should change the password after confirming the current password', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        [...fixture.nativeElement.querySelectorAll('.auth-button')].some(
          (button: HTMLElement) => button.textContent?.includes('Password')
        )
      ).toBe(true);
    });

    const passwordButton = [...fixture.nativeElement.querySelectorAll('.auth-button')]
      .find((button: HTMLElement) => button.textContent?.includes('Password')) as HTMLButtonElement;
    passwordButton.click();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll(
      'app-change-password-dialog input'
    );
    for (const [input, value] of [
      [inputs[0], 'correct-password'],
      [inputs[1], 'new-secure-password'],
      [inputs[2], 'new-secure-password']
    ] as [HTMLInputElement, string][]) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    (fixture.nativeElement.querySelector(
      'app-change-password-dialog form'
    ) as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-change-password-dialog')).toBeNull();
    });
  });

  it('should load and render the generated markdown workspace', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Index'
      );
    });

    expect(fixture.nativeElement.querySelector('app-file-tree')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-page-navigation')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.status-badge')?.textContent).toContain(
      'draft'
    );
    expect(fixture.nativeElement.querySelector('.document-summary')?.textContent).toContain(
      'Entry point for the game design.'
    );
    expect(fixture.nativeElement.querySelector('.markdown-body')?.textContent).not.toContain(
      'lastReviewed'
    );
  });

  it('should load the next markdown document', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button.next')).toBeTruthy();
    });

    fixture.nativeElement.querySelector('button.next').click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Story Brief'
      );
    });

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
  });

  it('should render and select childless entries as files', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(2);
    });

    const rows = fixture.nativeElement.querySelectorAll('.tree-row');
    expect(rows[1].classList.contains('folder')).toBe(false);
    (rows[1].querySelector('.node-select') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Story Brief'
      );
    });

    expect(rows[1].classList.contains('active')).toBe(true);
  });

  it('should create a child page and convert its parent into a folder', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Combat Notes');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(2);
    });

    const rows = fixture.nativeElement.querySelectorAll('.tree-row');
    (rows[1].querySelector('.add-child') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(repository.documents.has('storytelling/Combat Notes.md')).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(3);
    });

    const parent = fixture.nativeElement.querySelectorAll('.tree-row')[1];
    expect(parent.classList.contains('folder')).toBe(true);
    expect(fixture.nativeElement.querySelector('app-document-editor')).toBeTruthy();
    expect(
      (fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement).value
    ).toContain('# Combat Notes');
  });

  it('should confirm and delete a leaf document', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(2);
    });

    const secondRow = fixture.nativeElement.querySelectorAll('.tree-row')[1];
    (secondRow.querySelector('.delete-document') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.delete-modal')?.textContent).toContain(
      'Delete Storytelling?'
    );
    (fixture.nativeElement.querySelector('.confirm-delete') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(repository.documents.has('storytelling.md')).toBe(false);
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('.delete-modal')).toBeNull();
    });
  });

  it('should prevent deleting a page that still has children', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Combat Notes');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(2);
    });

    const initialRows = fixture.nativeElement.querySelectorAll('.tree-row');
    (initialRows[1].querySelector('.add-child') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.tree-row')).toHaveLength(3);
    });

    fixture.componentInstance.finishEditing();
    fixture.detectChanges();
    const parent = fixture.nativeElement.querySelectorAll('.tree-row')[1];
    (parent.querySelector('.delete-document') as HTMLButtonElement).click();
    fixture.detectChanges();

    const confirm = fixture.nativeElement.querySelector(
      '.confirm-delete'
    ) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.delete-modal')?.textContent).toContain(
      'Delete its children first'
    );
    expect(repository.documents.has('storytelling.md')).toBe(true);
  });

  it('should edit, preview, and save the active Firestore document', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
    });

    fixture.nativeElement.querySelector('.edit-button').click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector(
      'textarea[aria-label="Markdown document body"]'
    ) as HTMLTextAreaElement;
    textarea.value = `# Index

Edited body.`;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.editor-preview')?.textContent).toContain(
        'Edited body.'
      );
    });

    const saveButton = fixture.nativeElement.querySelector(
      '.editor-actions .primary'
    ) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
    saveButton.click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.markdown-body')?.textContent).toContain(
        'Edited body.'
      );
    });

    expect(fixture.nativeElement.querySelector('.document-summary-heading')?.textContent).toContain(
      '2026-06-09'
    );
  });

  it('should restore a persisted draft when entering Edit mode', async () => {
    localStorage.setItem(
      'manuscript-draft:index.md',
      JSON.stringify({
        body: '# Index\n\nRestored draft.',
        baseVersion: 1
      })
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
    });
    fixture.nativeElement.querySelector('.edit-button').click();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector(
        'textarea[aria-label="Markdown document body"]'
      ) as HTMLTextAreaElement).value
    ).toContain('Restored draft.');
  });

  it('should block invalid Markdown and display validation errors', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
    });
    fixture.nativeElement.querySelector('.edit-button').click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector(
      'textarea[aria-label="Markdown document body"]'
    ) as HTMLTextAreaElement;
    textarea.value = '# Wrong title\n\n[Missing](Missing.md)';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.editor-messages')?.textContent).toContain(
      'The H1 heading must be "Index".'
    );
    expect(fixture.nativeElement.querySelector('.editor-messages')?.textContent).toContain(
      'Broken internal Markdown link'
    );
    expect(
      (fixture.nativeElement.querySelector('.editor-actions .primary') as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('should preserve the draft and show both versions on a save conflict', async () => {
    repository.forceConflict = true;
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.edit-button')).toBeTruthy();
    });
    fixture.nativeElement.querySelector('.edit-button').click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector(
      'textarea[aria-label="Markdown document body"]'
    ) as HTMLTextAreaElement;
    textarea.value = '# Index\n\nMy local edit.';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.editor-actions .primary') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.conflict-dialog')).toBeTruthy();
    });

    const comparisons = fixture.nativeElement.querySelectorAll(
      '.conflict-comparison textarea'
    ) as NodeListOf<HTMLTextAreaElement>;
    expect(comparisons[0].value).toContain('My local edit.');
    expect(comparisons[1].value).toContain('Changed elsewhere.');
    expect(localStorage.getItem('manuscript-draft:index.md')).toContain('My local edit.');
  });

  it('should scroll to the top after loading the previous document', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button.next')).toBeTruthy();
    });

    fixture.nativeElement.querySelector('button.next').click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Story Brief'
      );
    });

    scrollTo.mockClear();
    fixture.nativeElement.querySelector('app-page-navigation button:not(.next)').click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Index'
      );
    });

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
  });

  it('should follow internal markdown links without leaving the application', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('a[href$="storytelling.md"]')
      ).toBeTruthy();
    });

    fixture.nativeElement.querySelector('a[href$="storytelling.md"]').click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Story Brief'
      );
    });
  });

  it('should open related documents from manifest metadata', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.related-documents button')
      ).toBeTruthy();
    });

    fixture.nativeElement.querySelector('.related-documents button').click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Story Brief'
      );
    });

    expect(fixture.nativeElement.querySelector('.status-badge')?.textContent).toContain(
      'review'
    );
  });

  it('should toggle and persist the light theme', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const themeButton = fixture.nativeElement.querySelector(
      '.theme-button'
    ) as HTMLButtonElement;
    themeButton.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('manuscript-theme')).toBe('light');
    expect(themeButton.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  it('should switch PlantUML blocks between diagram and source views', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.plantuml-block')).toBeTruthy();
    });

    const sourceButton = fixture.nativeElement.querySelector(
      '.plantuml-show-source'
    ) as HTMLButtonElement;
    sourceButton.click();

    const sourcePanel = fixture.nativeElement.querySelector('.plantuml-source');
    const diagramPanel = fixture.nativeElement.querySelector('.plantuml-diagram');
    expect(sourcePanel.classList.contains('is-hidden')).toBe(false);
    expect(diagramPanel.classList.contains('is-hidden')).toBe(true);
    expect(sourcePanel.textContent).toContain('Alice -> Bob: Hello');
    expect(sourceButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('should generate light and dark PlantUML diagram variants', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelectorAll('.plantuml-diagram img')
      ).toHaveLength(2);
    });

    const lightImage = fixture.nativeElement.querySelector(
      '.plantuml-image-light'
    ) as HTMLImageElement;
    const darkImage = fixture.nativeElement.querySelector(
      '.plantuml-image-dark'
    ) as HTMLImageElement;
    expect(lightImage.src).not.toBe(darkImage.src);
    expect(darkImage.alt).toBe(lightImage.alt);
    expect(getComputedStyle(lightImage).display).toBe('none');
    expect(getComputedStyle(darkImage).display).toBe('block');

    fixture.nativeElement.querySelector('.theme-button').click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('should open PlantUML diagrams in a zoomable lightbox', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.plantuml-image-dark')).toBeTruthy();
    });

    const diagram = fixture.nativeElement.querySelector(
      '.plantuml-image-dark'
    ) as HTMLImageElement;
    diagram.click();
    fixture.detectChanges();

    const lightbox = fixture.nativeElement.querySelector('.diagram-lightbox');
    const lightboxImage = fixture.nativeElement.querySelector(
      '.diagram-lightbox-viewport img'
    ) as HTMLImageElement;
    expect(lightbox).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
    expect(lightboxImage.style.width).toBe('100%');

    fixture.nativeElement.querySelector('[aria-label="Zoom in"]').click();
    fixture.detectChanges();
    expect(lightboxImage.style.width).toBe('125%');

    fixture.nativeElement.querySelector('[aria-label="Reset zoom"]').click();
    fixture.detectChanges();
    expect(lightboxImage.style.width).toBe('100%');

    fixture.nativeElement.querySelector('[aria-label="Close diagram"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.diagram-lightbox')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('should keep the diagram point under the cursor while wheel zooming', async () => {
    const animationFrames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.plantuml-image-dark')).toBeTruthy();
    });

    fixture.nativeElement.querySelector('.plantuml-image-dark').click();
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector(
      '.diagram-lightbox-viewport'
    ) as HTMLElement;
    const lightboxImage = viewport.querySelector('img') as HTMLImageElement;
    let zoomed = false;
    vi.spyOn(lightboxImage, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          left: zoomed ? -40 : 10,
          top: zoomed ? -20 : 20,
          width: zoomed ? 1150 : 1000,
          height: zoomed ? 575 : 500
        }) as DOMRect
    );

    viewport.scrollLeft = 120;
    viewport.scrollTop = 80;
    viewport.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: 410,
        clientY: 220,
        deltaY: -100,
        ctrlKey: true
      })
    );
    fixture.detectChanges();

    expect(lightboxImage.style.width).toBe('115%');
    zoomed = true;
    animationFrames.pop()?.(0);

    expect(viewport.scrollLeft).toBe(130);
    expect(viewport.scrollTop).toBe(70);
  });

  it('should leave unmodified wheel events available for diagram scrolling', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.plantuml-image-dark')).toBeTruthy();
    });

    fixture.nativeElement.querySelector('.plantuml-image-dark').click();
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector(
      '.diagram-lightbox-viewport'
    ) as HTMLElement;
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 100
    });
    viewport.dispatchEvent(wheelEvent);
    fixture.detectChanges();

    expect(wheelEvent.defaultPrevented).toBe(false);
    expect(
      (viewport.querySelector('img') as HTMLImageElement).style.width
    ).toBe('100%');
  });

  it('should pan the diagram by dragging with the middle mouse button', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.plantuml-image-dark')).toBeTruthy();
    });

    fixture.nativeElement.querySelector('.plantuml-image-dark').click();
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector(
      '.diagram-lightbox-viewport'
    ) as HTMLElement;
    viewport.scrollLeft = 300;
    viewport.scrollTop = 240;

    const startEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 1,
      clientX: 500,
      clientY: 400
    });
    viewport.dispatchEvent(startEvent);
    fixture.detectChanges();

    expect(startEvent.defaultPrevented).toBe(true);
    expect(viewport.classList.contains('is-panning')).toBe(true);

    document.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        buttons: 4,
        clientX: 450,
        clientY: 360
      })
    );

    expect(viewport.scrollLeft).toBe(350);
    expect(viewport.scrollTop).toBe(280);

    document.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        button: 1,
        clientX: 450,
        clientY: 360
      })
    );
    fixture.detectChanges();

    expect(viewport.classList.contains('is-panning')).toBe(false);
  });
});
