import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DocumentDescriptor,
  DocumentationManifest,
  LoadedDocument
} from '../models/document-page.model';
import { MarkdownRendererService } from './markdown-renderer.service';
import { AppUrlService } from './app-url.service';

@Injectable({ providedIn: 'root' })
export class DocumentationStore {
  private readonly renderer = inject(MarkdownRendererService);
  private readonly appUrl = inject(AppUrlService);
  private loadSequence = 0;

  readonly manifest = signal<DocumentationManifest | null>(null);
  readonly activePageIndex = signal(0);
  readonly activeDocument = signal<LoadedDocument | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly pages = computed(() => this.manifest()?.pages ?? []);
  readonly fileTree = computed(() => this.manifest()?.nodes ?? []);
  readonly previousPage = computed(() => this.pages()[this.activePageIndex() - 1]);
  readonly nextPage = computed(() => this.pages()[this.activePageIndex() + 1]);

  async initialize(): Promise<void> {
    try {
      const response = await fetch(this.appUrl.resolve('docs/manifest.json'));
      if (!response.ok) {
        throw new Error(`Manifest request failed with ${response.status}.`);
      }

      const manifest = (await response.json()) as DocumentationManifest;
      this.manifest.set(manifest);
      const entryIndex = manifest.pages.findIndex(
        (page) => page.path.toLowerCase() === 'index.md'
      );
      await this.selectPage(entryIndex === -1 ? 0 : entryIndex);
    } catch (error) {
      this.loading.set(false);
      this.error.set(error instanceof Error ? error.message : 'Unable to load documentation.');
    }
  }

  async selectPage(index: number): Promise<void> {
    const descriptor = this.pages()[index];
    if (!descriptor) {
      return;
    }

    const sequence = ++this.loadSequence;
    this.activePageIndex.set(index);
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(this.appUrl.resolve(descriptor.assetUrl));
      if (!response.ok) {
        throw new Error(`Document request failed with ${response.status}.`);
      }

      const source = await response.text();
      const markdown = this.stripFrontMatter(source);
      const html = await this.renderer.render(markdown, descriptor);
      if (sequence !== this.loadSequence) {
        return;
      }

      this.activeDocument.set({
        descriptor,
        title: this.extractTitle(markdown, descriptor.name),
        readingTime: this.calculateReadingTime(markdown),
        markdown,
        html
      });
    } catch (error) {
      if (sequence === this.loadSequence) {
        this.error.set(error instanceof Error ? error.message : 'Unable to load document.');
      }
    } finally {
      if (sequence === this.loadSequence) {
        this.loading.set(false);
      }
    }
  }

  selectPath(path: string): Promise<void> {
    const index = this.pages().findIndex((page) => page.path === path);
    return index === -1 ? Promise.resolve() : this.selectPage(index);
  }

  previous(): Promise<void> {
    return this.selectPage(this.activePageIndex() - 1);
  }

  next(): Promise<void> {
    return this.selectPage(this.activePageIndex() + 1);
  }

  private extractTitle(markdown: string, fallbackName: string): string {
    const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return heading ?? fallbackName.replace(/\.md$/i, '').replaceAll(/[-_]/g, ' ');
  }

  private calculateReadingTime(markdown: string): string {
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 220))} min read`;
  }

  private stripFrontMatter(markdown: string): string {
    if (!markdown.startsWith('---\n')) {
      return markdown;
    }

    const end = markdown.indexOf('\n---\n', 4);
    return end === -1 ? markdown : markdown.slice(end + 5);
  }
}
