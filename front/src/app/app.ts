import { Component, OnInit, inject, signal } from '@angular/core';
import { DocumentationStore } from './core/services/documentation-store.service';
import { FileTree } from './features/file-tree/file-tree';
import { MarkdownViewer } from './features/markdown-viewer/markdown-viewer';
import { TopNavbar } from './layout/top-navbar/top-navbar';
import { ThemeService } from './core/services/theme.service';
import { DocumentEditor } from './features/document-editor/document-editor';
import { FileTreeNode } from './core/models/file-tree-node.model';
import { AuthService } from './core/services/auth.service';
import { LoginDialog } from './features/login-dialog/login-dialog';
import { ChangePasswordDialog } from './features/change-password-dialog/change-password-dialog';

@Component({
  selector: 'app-root',
  imports: [
    TopNavbar,
    FileTree,
    MarkdownViewer,
    DocumentEditor,
    LoginDialog,
    ChangePasswordDialog
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  readonly store = inject(DocumentationStore);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(false);
  readonly editing = signal(false);
  readonly editorDirty = signal(false);
  readonly deleteTarget = signal<FileTreeNode | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly loginOpen = signal(false);
  readonly passwordChangeOpen = signal(false);

  ngOnInit(): void {
    void this.auth.initialize();
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

  async createDocument(parentPath: string | null): Promise<void> {
    if (!this.auth.isEditor() || !this.canLeaveEditor()) {
      return;
    }
    const name = window.prompt(
      parentPath
        ? `Create a page inside ${parentPath.replace(/\.md$/i, '')}`
        : 'Create a root page',
      'New Page'
    );
    if (name === null) {
      return;
    }

    try {
      await this.store.createDocument(parentPath, name);
      this.sidebarOpen.set(false);
      this.editing.set(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to create document.');
    }
  }

  requestDeleteDocument(node: FileTreeNode): void {
    if (!this.auth.isEditor()) {
      return;
    }
    this.deleteError.set(null);
    this.deleteTarget.set(node);
  }

  closeDeleteModal(): void {
    if (!this.deleting()) {
      this.deleteTarget.set(null);
      this.deleteError.set(null);
    }
  }

  async confirmDeleteDocument(): Promise<void> {
    const target = this.deleteTarget();
    if (
      !this.auth.isEditor() ||
      !target?.path ||
      target.children?.length ||
      !this.canLeaveEditor()
    ) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await this.store.deleteDocument(target.path);
      this.deleteTarget.set(null);
      this.sidebarOpen.set(false);
    } catch (error) {
      this.deleteError.set(
        error instanceof Error ? error.message : 'Unable to delete document.'
      );
    } finally {
      this.deleting.set(false);
    }
  }

  finishEditing(): void {
    this.editorDirty.set(false);
    this.editing.set(false);
  }

  async logout(): Promise<void> {
    if (!this.canLeaveEditor()) {
      return;
    }
    await this.auth.logout();
    this.deleteTarget.set(null);
    this.passwordChangeOpen.set(false);
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
