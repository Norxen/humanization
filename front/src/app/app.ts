import { Component, OnInit, inject, signal } from '@angular/core';
import { DocumentationStore } from './core/services/documentation-store.service';
import { FileTree } from './features/file-tree/file-tree';
import { MarkdownViewer } from './features/markdown-viewer/markdown-viewer';
import { TopNavbar } from './layout/top-navbar/top-navbar';
import { ThemeService } from './core/services/theme.service';
import { DocumentEditor } from './features/document-editor/document-editor';

@Component({
  selector: 'app-root',
  imports: [TopNavbar, FileTree, MarkdownViewer, DocumentEditor],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  readonly store = inject(DocumentationStore);
  readonly themeService = inject(ThemeService);
  readonly sidebarOpen = signal(false);
  readonly editing = signal(false);
  readonly editorDirty = signal(false);

  ngOnInit(): void {
    void this.store.initialize();
  }

  selectPage(index: number): void {
    if (!this.canLeaveEditor()) {
      return;
    }
    this.sidebarOpen.set(false);
    void this.store.selectPage(index);
  }

  async goPrevious(): Promise<void> {
    if (!this.canLeaveEditor()) {
      return;
    }
    await this.store.previous();
    this.scrollToDocumentTop();
  }

  async goNext(): Promise<void> {
    if (!this.canLeaveEditor()) {
      return;
    }
    await this.store.next();
    this.scrollToDocumentTop();
  }

  selectPath(path: string): void {
    if (!this.canLeaveEditor()) {
      return;
    }
    void this.store.selectPath(path);
  }

  finishEditing(): void {
    this.editorDirty.set(false);
    this.editing.set(false);
  }

  private canLeaveEditor(): boolean {
    if (!this.editing()) {
      return true;
    }
    if (
      this.editorDirty() &&
      !window.confirm('Leave Edit mode? Your unsaved local draft will be preserved.')
    ) {
      return false;
    }
    this.finishEditing();
    return true;
  }

  private scrollToDocumentTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
