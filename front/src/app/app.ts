import { Component, OnInit, inject, signal } from '@angular/core';
import { DocumentationStore } from './core/services/documentation-store.service';
import { FileTree } from './features/file-tree/file-tree';
import { MarkdownViewer } from './features/markdown-viewer/markdown-viewer';
import { TopNavbar } from './layout/top-navbar/top-navbar';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [TopNavbar, FileTree, MarkdownViewer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  readonly store = inject(DocumentationStore);
  readonly themeService = inject(ThemeService);
  readonly sidebarOpen = signal(false);

  ngOnInit(): void {
    void this.store.initialize();
  }

  selectPage(index: number): void {
    this.sidebarOpen.set(false);
    void this.store.selectPage(index);
  }

  async goPrevious(): Promise<void> {
    await this.store.previous();
    this.scrollToDocumentTop();
  }

  async goNext(): Promise<void> {
    await this.store.next();
    this.scrollToDocumentTop();
  }

  private scrollToDocumentTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
