import {
  Component,
  HostListener,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  DocumentDescriptor,
  LoadedDocument
} from '../../core/models/document-page.model';
import { PageNavigation } from '../../shared/page-navigation/page-navigation';
import { AppUrlService } from '../../core/services/app-url.service';

@Component({
  selector: 'app-markdown-viewer',
  imports: [PageNavigation],
  templateUrl: './markdown-viewer.html',
  styleUrl: './markdown-viewer.css',
  encapsulation: ViewEncapsulation.None
})
export class MarkdownViewer implements OnDestroy {
  private readonly appUrl = inject(AppUrlService);
  private panState: {
    viewport: HTMLElement;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null = null;
  readonly lightboxImage = signal<{ src: string; alt: string } | null>(null);
  readonly lightboxZoom = signal(1);
  readonly lightboxZoomPercentage = computed(() => Math.round(this.lightboxZoom() * 100));
  readonly isPanning = signal(false);
  readonly document = input.required<LoadedDocument>();
  readonly previousPage = input<DocumentDescriptor>();
  readonly nextPage = input<DocumentDescriptor>();
  readonly canEdit = input(false);
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly documentSelected = output<string>();
  readonly edit = output<void>();

  selectRelatedDocument(path: string): void {
    this.documentSelected.emit(path);
  }

  relatedDocumentName(path: string): string {
    return path.replace(/\.md$/i, '').replaceAll('/', ' / ');
  }

  handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const diagramImage = target.closest<HTMLImageElement>('.plantuml-image');
    if (diagramImage && getComputedStyle(diagramImage).display !== 'none') {
      this.openLightbox(diagramImage);
      return;
    }

    const viewButton = target.closest<HTMLButtonElement>(
      '.plantuml-show-diagram, .plantuml-show-source'
    );
    if (viewButton) {
      this.togglePlantUmlView(viewButton);
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a[href]');
    const href = link?.getAttribute('href');
    const documentPath = href
      ? this.appUrl.relativePath(href.split('#', 1)[0], 'docs/game-design')
      : null;
    if (documentPath?.toLowerCase().endsWith('.md')) {
      event.preventDefault();
      this.documentSelected.emit(documentPath);
    }
  }

  @HostListener('document:keydown.escape')
  closeLightbox(): void {
    if (!this.lightboxImage()) {
      return;
    }

    this.lightboxImage.set(null);
    this.lightboxZoom.set(1);
    this.stopPanning();
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    this.stopPanning();
    document.body.style.overflow = '';
  }

  zoomIn(): void {
    this.setZoom(this.lightboxZoom() + 0.25);
  }

  zoomOut(): void {
    this.setZoom(this.lightboxZoom() - 0.25);
  }

  resetZoom(): void {
    this.lightboxZoom.set(1);
  }

  handleZoomWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.shiftKey) {
      return;
    }

    event.preventDefault();
    const viewport = event.currentTarget;
    if (!(viewport instanceof HTMLElement)) {
      return;
    }

    const image = viewport.querySelector<HTMLImageElement>('img');
    if (!image) {
      return;
    }

    const imageRect = image.getBoundingClientRect();
    const nextZoom = this.clampZoom(
      this.lightboxZoom() + (event.deltaY < 0 ? 0.15 : -0.15)
    );
    if (nextZoom === this.lightboxZoom() || imageRect.width === 0 || imageRect.height === 0) {
      return;
    }

    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const imagePointX = (pointerX - imageRect.left) / imageRect.width;
    const imagePointY = (pointerY - imageRect.top) / imageRect.height;

    this.lightboxZoom.set(nextZoom);
    requestAnimationFrame(() => {
      const resizedRect = image.getBoundingClientRect();
      viewport.scrollLeft +=
        resizedRect.left + imagePointX * resizedRect.width - pointerX;
      viewport.scrollTop +=
        resizedRect.top + imagePointY * resizedRect.height - pointerY;
    });
  }

  startPanning(event: MouseEvent): void {
    if (event.button !== 1) {
      return;
    }

    const viewport = event.currentTarget;
    if (!(viewport instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    this.panState = {
      viewport,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop
    };
    this.isPanning.set(true);
  }

  @HostListener('document:mousemove', ['$event'])
  continuePanning(event: MouseEvent): void {
    if (!this.panState) {
      return;
    }

    event.preventDefault();
    this.panState.viewport.scrollLeft =
      this.panState.startScrollLeft - (event.clientX - this.panState.startX);
    this.panState.viewport.scrollTop =
      this.panState.startScrollTop - (event.clientY - this.panState.startY);
  }

  @HostListener('document:mouseup', ['$event'])
  finishPanning(event: MouseEvent): void {
    if (event.button === 1) {
      this.stopPanning();
    }
  }

  preventMiddleClick(event: MouseEvent): void {
    if (event.button === 1) {
      event.preventDefault();
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  private openLightbox(image: HTMLImageElement): void {
    this.lightboxImage.set({
      src: image.currentSrc || image.src,
      alt: image.alt || 'PlantUML diagram'
    });
    this.lightboxZoom.set(1);
    document.body.style.overflow = 'hidden';
  }

  private setZoom(zoom: number): void {
    this.lightboxZoom.set(this.clampZoom(zoom));
  }

  private clampZoom(zoom: number): number {
    return Math.min(3, Math.max(0.5, Number(zoom.toFixed(2))));
  }

  private stopPanning(): void {
    this.panState = null;
    this.isPanning.set(false);
  }

  private togglePlantUmlView(button: HTMLButtonElement): void {
    const figure = button.closest('.plantuml-block');
    const diagram = figure?.querySelector('.plantuml-diagram');
    const source = figure?.querySelector('.plantuml-source');
    const diagramButton = figure?.querySelector<HTMLButtonElement>('.plantuml-show-diagram');
    const sourceButton = figure?.querySelector<HTMLButtonElement>('.plantuml-show-source');
    if (!diagram || !source || !diagramButton || !sourceButton) {
      return;
    }

    const showSource = button.classList.contains('plantuml-show-source');
    diagram.classList.toggle('is-hidden', showSource);
    source.classList.toggle('is-hidden', !showSource);
    diagramButton.classList.toggle('active', !showSource);
    sourceButton.classList.toggle('active', showSource);
    diagramButton.setAttribute('aria-pressed', String(!showSource));
    sourceButton.setAttribute('aria-pressed', String(showSource));
  }
}
