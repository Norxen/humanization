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
          : `# Game Design Index

Read the [Story Brief](storytelling.md).

\`\`\`plantuml
@startuml
Alice -> Bob: Hello
@enduml
\`\`\``;
        return new Response(markdown, { status: 200 });
      })
    );

    await TestBed.configureTestingModule({
      imports: [App]
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
        'Game Design Index'
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
});
