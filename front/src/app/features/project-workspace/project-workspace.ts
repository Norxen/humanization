import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentationStore } from '../../core/services/documentation-store.service';
import { FileTree } from '../file-tree/file-tree';
import { MarkdownViewer } from '../markdown-viewer/markdown-viewer';
import { TopNavbar } from '../../layout/top-navbar/top-navbar';
import { ThemeService } from '../../core/services/theme.service';
import { DocumentEditor } from '../document-editor/document-editor';
import { FileTreeNode } from '../../core/models/file-tree-node.model';
import { AuthService } from '../../core/services/auth.service';
import { LoginDialog } from '../login-dialog/login-dialog';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';
import { ProjectStore } from '../../core/services/project-store.service';

@Component({
  selector: 'app-project-workspace',
  imports: [
    TopNavbar,
    FileTree,
    MarkdownViewer,
    DocumentEditor,
    LoginDialog,
    ChangePasswordDialog
  ],
  templateUrl: './project-workspace.html',
  styleUrl: './project-workspace.css'
})
export class ProjectWorkspace implements OnInit {
  readonly store = inject(DocumentationStore);
  readonly projects = inject(ProjectStore);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly projectId = signal('');
  readonly sidebarOpen = signal(false);
  readonly editing = signal(false);
  readonly editorDirty = signal(false);
  readonly deleteTarget = signal<FileTreeNode | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly loginOpen = signal(false);
  readonly passwordChangeOpen = signal(false);
  readonly settingsOpen = signal(false);
  readonly settingsError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.auth.initialize();
    await this.projects.loadLobby();
    this.route.paramMap.subscribe((parameters) => {
      void this.openProject(
        parameters.get('projectId') ?? '',
        parameters.get('slug') ?? ''
      );
    });
  }

  private async openProject(projectId: string, routeSlug: string): Promise<void> {
    if (!this.canLeaveEditor()) {
      const current = this.projects.activeProject();
      if (current) {
        await this.router.navigate(['/projects', current.id, current.slug], {
          replaceUrl: true
        });
      }
      return;
    }
    this.projectId.set(projectId);
    try {
      const project = await this.projects.loadProject(projectId);
      if (project.status !== 'active' && !this.auth.isPlatformAdmin()) {
        throw new Error('This project is archived.');
      }
      if (routeSlug !== project.slug) {
        await this.router.navigate(['/projects', project.id, project.slug], {
          replaceUrl: true
        });
      }
      await this.store.initialize(project.id);
    } catch (error) {
      await this.router.navigate(['/'], {
        state: { projectError: error instanceof Error ? error.message : 'Project unavailable.' }
      });
    }
  }

  selectPage(index: number): void {
    if (!this.canLeaveEditor()) return;
    this.sidebarOpen.set(false);
    void this.store.selectPage(index);
  }

  async goPrevious(): Promise<void> {
    if (!this.canLeaveEditor()) return;
    await this.store.previous();
    this.scrollToDocumentTop();
  }

  async goNext(): Promise<void> {
    if (!this.canLeaveEditor()) return;
    await this.store.next();
    this.scrollToDocumentTop();
  }

  selectPath(path: string): void {
    if (this.canLeaveEditor()) void this.store.selectPath(path);
  }

  async createDocument(parentPath: string | null): Promise<void> {
    if (!this.projects.canEditActive() || !this.canLeaveEditor()) return;
    const name = window.prompt(
      parentPath ? `Create a page inside ${parentPath.replace(/\.md$/i, '')}` : 'Create a root page',
      'New Page'
    );
    if (name === null) return;
    try {
      await this.store.createDocument(parentPath, name);
      this.sidebarOpen.set(false);
      this.editing.set(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to create document.');
    }
  }

  requestDeleteDocument(node: FileTreeNode): void {
    if (this.projects.canEditActive()) this.deleteTarget.set(node);
  }

  async confirmDeleteDocument(): Promise<void> {
    const target = this.deleteTarget();
    if (!target?.path || target.children?.length || !this.canLeaveEditor()) return;
    this.deleting.set(true);
    try {
      await this.store.deleteDocument(target.path);
      this.deleteTarget.set(null);
    } catch (error) {
      this.deleteError.set(error instanceof Error ? error.message : 'Unable to delete document.');
    } finally {
      this.deleting.set(false);
    }
  }

  finishEditing(): void {
    this.editorDirty.set(false);
    this.editing.set(false);
  }

  async logout(): Promise<void> {
    if (!this.canLeaveEditor()) return;
    await this.auth.logout();
    await this.projects.loadProject(this.projectId());
  }

  switchProject(project: { id: string; slug: string }): void {
    if (!this.canLeaveEditor()) return;
    void this.router.navigate(['/projects', project.id, project.slug]);
  }

  async updateProject(name: string, slug: string, description: string): Promise<void> {
    this.settingsError.set(null);
    try {
      const updated = await this.projects.update({ name, slug, description });
      this.settingsOpen.set(false);
      await this.router.navigate(['/projects', updated.id, updated.slug], { replaceUrl: true });
    } catch (error) {
      this.settingsError.set(error instanceof Error ? error.message : 'Unable to update project.');
    }
  }

  async addEditor(userId: string): Promise<void> {
    try {
      await this.projects.addEditor(userId);
    } catch (error) {
      this.settingsError.set(error instanceof Error ? error.message : 'Unable to add editor.');
    }
  }

  async archiveProject(): Promise<void> {
    if (!window.confirm('Archive this project? It will disappear from the public lobby.')) return;
    await this.projects.archive();
    await this.router.navigate(['/']);
  }

  async transferOwnership(userId: string): Promise<void> {
    if (!window.confirm(`Transfer ownership to ${userId}? You will remain an editor.`)) return;
    await this.projects.transferOwnership(userId);
  }

  private canLeaveEditor(): boolean {
    if (!this.editing()) return true;
    if (this.editorDirty() && !window.confirm('Leave Edit mode? Your unsaved local draft will be preserved.')) {
      return false;
    }
    this.finishEditing();
    return true;
  }

  private scrollToDocumentTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
