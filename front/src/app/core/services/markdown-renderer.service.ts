import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { encode as encodePlantUml } from 'plantuml-encoder';
import { DocumentDescriptor } from '../models/document-page.model';
import { AppUrlService } from './app-url.service';

@Injectable({ providedIn: 'root' })
export class MarkdownRendererService {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly appUrl = inject(AppUrlService);

  async render(markdown: string, document: DocumentDescriptor): Promise<SafeHtml> {
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

    const sanitizedHtml =
      this.sanitizer.sanitize(SecurityContext.HTML, container.body.innerHTML) ?? '';
    const sanitizedContainer = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    this.renderPlantUmlBlocks(sanitizedContainer);

    return this.sanitizer.bypassSecurityTrustHtml(sanitizedContainer.body.innerHTML);
  }

  private renderPlantUmlBlocks(container: Document): void {
    const blocks = container.querySelectorAll('pre > code.language-plantuml');

    for (const [index, code] of Array.from(blocks).entries()) {
      const source = code.textContent?.trim();
      const pre = code.parentElement;
      if (!source || !pre) {
        continue;
      }

      const title = source.match(/^title\s+(.+)$/m)?.[1]?.trim() ?? `PlantUML diagram ${index + 1}`;
      const figure = container.createElement('figure');
      figure.className = 'plantuml-block';

      const toolbar = container.createElement('div');
      toolbar.className = 'plantuml-toolbar';

      const label = container.createElement('span');
      label.className = 'plantuml-label';
      label.textContent = 'PlantUML';

      const controls = container.createElement('div');
      controls.className = 'plantuml-controls';
      controls.setAttribute('role', 'group');
      controls.setAttribute('aria-label', `View options for ${title}`);

      const diagramButton = this.viewButton(container, 'Diagram', 'plantuml-show-diagram', true);
      const sourceButton = this.viewButton(container, 'Source', 'plantuml-show-source', false);
      controls.append(diagramButton, sourceButton);
      toolbar.append(label, controls);

      const diagramPanel = container.createElement('div');
      diagramPanel.className = 'plantuml-panel plantuml-diagram';
      const image = container.createElement('img');
      image.src = `https://www.plantuml.com/plantuml/svg/${encodePlantUml(source)}`;
      image.alt = title;
      image.loading = 'lazy';
      diagramPanel.append(image);

      const sourcePanel = container.createElement('div');
      sourcePanel.className = 'plantuml-panel plantuml-source is-hidden';
      const sourcePre = container.createElement('pre');
      const sourceCode = container.createElement('code');
      sourceCode.className = 'language-plantuml';
      sourceCode.textContent = source;
      sourcePre.append(sourceCode);
      sourcePanel.append(sourcePre);

      figure.append(toolbar, diagramPanel, sourcePanel);
      pre.replaceWith(figure);
    }
  }

  private viewButton(
    container: Document,
    label: string,
    className: string,
    active: boolean
  ): HTMLButtonElement {
    const button = container.createElement('button');
    button.type = 'button';
    button.className = `${className}${active ? ' active' : ''}`;
    button.setAttribute('aria-pressed', String(active));
    button.textContent = label;
    return button;
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
