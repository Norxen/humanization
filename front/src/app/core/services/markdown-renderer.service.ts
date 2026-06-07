import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { DocumentDescriptor } from '../models/document-page.model';
import { AppUrlService } from './app-url.service';

@Injectable({ providedIn: 'root' })
export class MarkdownRendererService {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly appUrl = inject(AppUrlService);

  async render(markdown: string, document: DocumentDescriptor): Promise<string> {
    const parsed = await marked.parse(markdown, { gfm: true });
    const container = new DOMParser().parseFromString(parsed, 'text/html');
    const documentDirectory = this.directoryName(document.path);

    for (const image of container.querySelectorAll('img[src]')) {
      const source = image.getAttribute('src');
      if (source && this.isRelativeUrl(source)) {
        image.setAttribute('src', this.assetUrl(this.resolvePath(documentDirectory, source)));
      }
    }

    for (const link of container.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (!href || !this.isRelativeUrl(href)) {
        continue;
      }

      const [path, fragment] = href.split('#', 2);
      if (path.toLowerCase().endsWith('.md')) {
        const documentPath = this.resolvePath(documentDirectory, path);
        link.setAttribute(
          'href',
          `${this.assetUrl(documentPath)}${fragment ? `#${fragment}` : ''}`
        );
      } else {
        link.setAttribute('href', this.assetUrl(this.resolvePath(documentDirectory, href)));
      }
    }

    return this.sanitizer.sanitize(SecurityContext.HTML, container.body.innerHTML) ?? '';
  }

  private assetUrl(path: string): string {
    return this.appUrl.resolve(`docs/game-design/${path}`);
  }

  private directoryName(path: string): string {
    const separator = path.lastIndexOf('/');
    return separator === -1 ? '' : path.slice(0, separator);
  }

  private resolvePath(directory: string, relativePath: string): string {
    const segments = `${directory}/${relativePath}`.split('/');
    const resolved: string[] = [];

    for (const segment of segments) {
      if (!segment || segment === '.') {
        continue;
      }
      segment === '..' ? resolved.pop() : resolved.push(segment);
    }

    return resolved.join('/');
  }

  private isRelativeUrl(url: string): boolean {
    return !/^(?:[a-z]+:|\/|#)/i.test(url);
  }
}
