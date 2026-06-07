import { Component, ViewEncapsulation, input, output } from '@angular/core';
import {
  DocumentDescriptor,
  LoadedDocument
} from '../../core/models/document-page.model';
import { PageNavigation } from '../../shared/page-navigation/page-navigation';
import { AppUrlService } from '../../core/services/app-url.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-markdown-viewer',
  imports: [PageNavigation],
  templateUrl: './markdown-viewer.html',
  styleUrl: './markdown-viewer.css',
  encapsulation: ViewEncapsulation.None
})
export class MarkdownViewer {
  private readonly appUrl = inject(AppUrlService);
  readonly document = input.required<LoadedDocument>();
  readonly previousPage = input<DocumentDescriptor>();
  readonly nextPage = input<DocumentDescriptor>();
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly documentSelected = output<string>();

  handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
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
