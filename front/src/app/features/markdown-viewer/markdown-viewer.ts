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
}
