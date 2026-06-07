import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentationManifest } from './core/models/document-page.model';
import { App } from './app';

const manifest: DocumentationManifest = {
  name: 'game-design',
  generatedAt: '2026-06-07T00:00:00.000Z',
  nodes: [
    {
      id: 'index.md',
      name: 'index.md',
      displayName: 'Index',
      displayPath: ['Index'],
      title: 'Game Design Index',
      type: 'markdown',
      path: 'index.md',
      assetUrl: 'docs/game-design/index.md',
      pageIndex: 0
    },
    {
      id: 'storytelling.md',
      name: 'storytelling.md',
      displayName: 'Storytelling',
      displayPath: ['Storytelling'],
      title: 'Story Brief',
      type: 'markdown',
      path: 'storytelling.md',
      assetUrl: 'docs/game-design/storytelling.md',
      pageIndex: 1
    }
  ],
  pages: [
    {
      id: 'index.md',
      name: 'index.md',
      displayName: 'Index',
      displayPath: ['Index'],
      title: 'Game Design Index',
      path: 'index.md',
      assetUrl: 'docs/game-design/index.md',
      pageIndex: 0
    },
    {
      id: 'storytelling.md',
      name: 'storytelling.md',
      displayName: 'Storytelling',
      displayPath: ['Storytelling'],
      title: 'Story Brief',
      path: 'storytelling.md',
      assetUrl: 'docs/game-design/storytelling.md',
      pageIndex: 1
    }
  ]
};

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
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

        const markdown = url.endsWith('storytelling.md')
          ? '# Story Brief\n\nThe narrative foundation.'
          : '# Game Design Index\n\nRead the [Story Brief](storytelling.md).';
        return new Response(markdown, { status: 200 });
      })
    );

    await TestBed.configureTestingModule({
      imports: [App]
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load and render the generated markdown workspace', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        'Game Design Index'
      );
    });

    expect(fixture.nativeElement.querySelector('app-file-tree')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-page-navigation')).toBeTruthy();
  });

  it('should load the next markdown document', async () => {
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
});
