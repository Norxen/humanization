import { Component, input, output } from '@angular/core';
import { DocumentDescriptor } from '../../core/models/document-page.model';

@Component({
  selector: 'app-page-navigation',
  templateUrl: './page-navigation.html',
  styleUrl: './page-navigation.css'
})
export class PageNavigation {
  readonly previousPage = input<DocumentDescriptor>();
  readonly nextPage = input<DocumentDescriptor>();
  readonly previous = output<void>();
  readonly next = output<void>();
}
