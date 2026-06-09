import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DocumentDescriptor,
  DocumentationManifest,
  LoadedDocument
} from '../models/document-page.model';
import { MarkdownRendererService } from './markdown-renderer.service';
import { DOCUMENT_REPOSITORY } from '../repositories/document.repository';
import { AppUrlService } from './app-url.service';

@Injectable({ providedIn: 'root' })
export class DocumentationStore {
  private readonly renderer = inject(MarkdownRendererService);
  private readonly appUrl = inject(AppUrlService);
  private readonly repository = inject(DOCUMENT_REPOSITORY);
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
      const stored = await this.repository.load(descriptor.path);
      const runtimeDescriptor = {
        ...descriptor,
        lastReviewed: stored.lastReviewed
      };
      const html = await this.renderer.render(stored.body, runtimeDescriptor);
      if (sequence !== this.loadSequence) {
        return;
      }

      this.activeDocument.set({
        descriptor: runtimeDescriptor,
        title: this.extractTitle(stored.body, descriptor.name),
        readingTime: this.calculateReadingTime(stored.body),
        markdown: stored.body,
        html,
        version: stored.version,
        updatedAt: stored.updatedAt
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

  async saveCurrent(body: string, expectedVersion: number): Promise<LoadedDocument> {
    const current = this.activeDocument();
    if (!current) {
      throw new Error('No active document is available to save.');
    }

    const saved = await this.repository.save(
      current.descriptor.path,
      body,
      expectedVersion
    );
    const descriptor = {
      ...current.descriptor,
      lastReviewed: saved.lastReviewed
    };
    const html = await this.renderer.render(saved.body, descriptor);
    const loaded: LoadedDocument = {
      descriptor,
      title: this.extractTitle(saved.body, descriptor.name),
      readingTime: this.calculateReadingTime(saved.body),
      markdown: saved.body,
      html,
      version: saved.version,
      updatedAt: saved.updatedAt
    };
    this.activeDocument.set(loaded);
    return loaded;
  }

  private extractTitle(markdown: string, fallbackName: string): string {
    const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return heading ?? fallbackName.replace(/\.md$/i, '').replaceAll(/[-_]/g, ' ');
  }

  private calculateReadingTime(markdown: string): string {
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 220))} min read`;
  }

}
