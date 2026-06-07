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
      pageIndex: 0,
      status: 'draft',
      lastReviewed: '2026-06-07',
      summary: 'Entry point for the game design.',
      related: ['storytelling.md']
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
      pageIndex: 1,
      status: 'review',
      lastReviewed: '2026-06-06',
      summary: 'Narrative foundation.',
      related: ['index.md']
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
      pageIndex: 0,
      status: 'draft',
      lastReviewed: '2026-06-07',
      summary: 'Entry point for the game design.',
      related: ['storytelling.md']
    },
    {
      id: 'storytelling.md',
      name: 'storytelling.md',
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
          ? `---
status: review
lastReviewed: 2026-06-06
summary: Narrative foundation.
related:
  - index.md
---
# Story Brief

The narrative foundation.`
          : `---
status: draft
lastReviewed: 2026-06-07
summary: Entry point for the game design.
related:
  - storytelling.md
---
# Game Design Index

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
