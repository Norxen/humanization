import { ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';

type PendingEditorAction =
  | { type: 'select-page'; index: number }
  | { type: 'previous' }
  | { type: 'next' }
  | { type: 'select-path'; path: string }
  | { type: 'create-document'; parentPath: string | null }
  | { type: 'delete-document'; node: FileTreeNode }
  | { type: 'logout' };

@Component({
  selector: 'app-project-workspace',
  imports: [
    TopNavbar,
    FileTree,
    MarkdownViewer,
    DocumentEditor,
    LoginDialog,
    ChangePasswordDialog,
    Modal,
    ConfirmDialog
  ],
  templateUrl: './project-workspace.html',
  styleUrl: './project-workspace.css'
})
export class ProjectWorkspace implements OnInit {
  readonly store = inject(DocumentationStore);
  readonly projects = inject(ProjectStore);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly projectId = signal('');
  readonly sidebarOpen = signal(false);
  readonly editing = signal(false);
  readonly editorDirty = signal(false);
  readonly deleteTarget = signal<FileTreeNode | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly createParent = signal<string | null | undefined>(undefined);
  readonly createName = signal('');
  readonly creatingDocument = signal(false);
  readonly createError = signal<string | null>(null);
  readonly loginOpen = signal(false);
  readonly passwordChangeOpen = signal(false);
  readonly settingsOpen = signal(false);
  readonly settingsError = signal<string | null>(null);
  readonly settingsPending = signal(false);
  readonly settingsName = signal('');
  readonly settingsSlug = signal('');
  readonly settingsDescription = signal('');
  readonly memberPending = signal<string | null>(null);
  readonly confirmation = signal<
    { type: 'archive' | 'transfer' | 'remove'; userId?: string } | null
  >(null);
  readonly confirmationError = signal<string | null>(null);
  readonly pendingEditorAction = signal<PendingEditorAction | null>(null);
  readonly routeLeavePending = signal(false);
  private routeLeavePromise: Promise<boolean> | null = null;
  private routeLeaveResolver: ((allow: boolean) => void) | null = null;
  readonly settingsDirty = computed(() => {
    const project = this.projects.activeProject();
    return Boolean(project) && (
      this.settingsName() !== project!.name
      || this.settingsSlug() !== project!.slug
      || this.settingsDescription() !== project!.description
    );
  });

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
    this.projectId.set(projectId);
    try {
      const project = await this.projects.loadProject(projectId);
      if (project.status !== 'active' && !this.auth.isPlatformAdmin()) {
        throw new Error('This project is archived.');
      }
      if (routeSlug !== project.slug) {
        await this.router.navigate(['/projects', project.id, project.slug], {
          replaceUrl: true,
          queryParamsHandling: 'preserve'
        });
      }
      await this.store.initialize(project.id);
      const requestedDocument = this.route.snapshot.queryParamMap.get('document');
      if (requestedDocument) {
        await this.store.selectPath(requestedDocument);
      }
    } catch (error) {
      await this.router.navigate(['/'], {
        state: { projectError: error instanceof Error ? error.message : 'Project unavailable.' }
      });
    }
  }

  selectPage(index: number): void {
    this.requestEditorAction({ type: 'select-page', index });
  }

  goPrevious(): void {
    this.requestEditorAction({ type: 'previous' });
  }

  goNext(): void {
    this.requestEditorAction({ type: 'next' });
  }

  selectPath(path: string): void {
    this.requestEditorAction({ type: 'select-path', path });
  }

  openCreateDocument(parentPath: string | null): void {
    if (!this.projects.canEditActive()) return;
    this.requestEditorAction({ type: 'create-document', parentPath });
  }

  async createDocument(): Promise<void> {
    const parentPath = this.createParent();
    if (parentPath === undefined || !this.createName().trim()) return;
    this.creatingDocument.set(true);
    this.createError.set(null);
    try {
      await this.store.createDocument(parentPath, this.createName());
      this.createParent.set(undefined);
      this.sidebarOpen.set(false);
      this.editing.set(true);
      this.toasts.success('Document created.');
    } catch (error) {
      this.createError.set(error instanceof Error ? error.message : 'Unable to create document.');
    } finally {
      this.creatingDocument.set(false);
    }
  }

  requestDeleteDocument(node: FileTreeNode): void {
    if (!this.projects.canEditActive()) return;
    this.deleteError.set(null);
    this.requestEditorAction({ type: 'delete-document', node });
  }

  async confirmDeleteDocument(): Promise<void> {
    const target = this.deleteTarget();
    if (!target?.path || target.children?.length) return;
    this.deleting.set(true);
    try {
      await this.store.deleteDocument(target.path);
      this.deleteTarget.set(null);
      this.toasts.success('Document deleted.');
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

  logout(): void {
    this.requestEditorAction({ type: 'logout' });
  }

  async refreshAccessAfterLogin(): Promise<void> {
    this.loginOpen.set(false);
    await this.projects.loadLobby();
    await this.projects.loadProject(this.projectId());
    this.changeDetector.markForCheck();
  }

  switchProject(project: { id: string; slug: string }): void {
    void this.router.navigate(['/projects', project.id, project.slug]);
  }

  leaveToLobby(): void {
    void this.router.navigate(['/']);
  }

  openSettings(): void {
    const project = this.projects.activeProject();
    if (!project) return;
    this.settingsName.set(project.name);
    this.settingsSlug.set(project.slug);
    this.settingsDescription.set(project.description);
    this.settingsError.set(null);
    this.settingsOpen.set(true);
  }

  async updateProject(): Promise<void> {
    this.settingsError.set(null);
    this.settingsPending.set(true);
    try {
      const updated = await this.projects.update({
        name: this.settingsName(),
        slug: this.settingsSlug(),
        description: this.settingsDescription()
      });
      this.settingsOpen.set(false);
      this.toasts.success('Project settings saved.');
      await this.router.navigate(['/projects', updated.id, updated.slug], { replaceUrl: true });
    } catch (error) {
      this.settingsError.set(error instanceof Error ? error.message : 'Unable to update project.');
    } finally {
      this.settingsPending.set(false);
    }
  }

  async addEditor(userId: string): Promise<void> {
    const normalized = userId.trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(normalized)) {
      this.settingsError.set('Enter a valid Firebase user UID.');
      return;
    }
    this.memberPending.set(`add:${normalized}`);
    try {
      await this.projects.addEditor(normalized);
      this.toasts.success('Editor added.');
    } catch (error) {
      this.settingsError.set(error instanceof Error ? error.message : 'Unable to add editor.');
    } finally {
      this.memberPending.set(null);
    }
  }

  requestRemoveEditor(userId: string): void {
    this.confirmationError.set(null);
    this.confirmation.set({ type: 'remove', userId });
  }

  requestTransferOwnership(userId: string): void {
    const normalized = userId.trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(normalized)) {
      this.settingsError.set('Enter a valid Firebase user UID.');
      return;
    }
    this.confirmationError.set(null);
    this.confirmation.set({ type: 'transfer', userId: normalized });
  }

  requestArchiveProject(): void {
    this.confirmationError.set(null);
    this.confirmation.set({ type: 'archive' });
  }

  createPathPreview(): string {
    const name = this.createName().trim().replace(/\.md$/i, '') || 'New Page';
    const parent = this.createParent()?.replace(/\.md$/i, '');
    return parent ? `${parent}/${name}.md` : `${name}.md`;
  }

  createTitlePreview(): string {
    return (this.createName().trim().replace(/\.md$/i, '') || 'New Page')
      .replaceAll(/[-_]/g, ' ');
  }

  async archiveProject(): Promise<void> {
    this.settingsPending.set(true);
    try {
      await this.projects.archive();
      this.confirmation.set(null);
      this.settingsOpen.set(false);
      this.toasts.success('Project archived.');
      await this.router.navigate(['/']);
    } catch (error) {
      this.confirmationError.set(error instanceof Error ? error.message : 'Unable to archive project.');
    } finally {
      this.settingsPending.set(false);
    }
  }

  async transferOwnership(userId: string): Promise<void> {
    this.settingsPending.set(true);
    try {
      await this.projects.transferOwnership(userId);
      this.confirmation.set(null);
      this.toasts.success('Project ownership transferred.');
    } catch (error) {
      this.confirmationError.set(error instanceof Error ? error.message : 'Unable to transfer ownership.');
    } finally {
      this.settingsPending.set(false);
    }
  }

  async removeEditor(userId: string): Promise<void> {
    this.memberPending.set(`remove:${userId}`);
    try {
      await this.projects.removeEditor(userId);
      this.confirmation.set(null);
      this.toasts.success('Editor access removed.');
    } catch (error) {
      this.confirmationError.set(error instanceof Error ? error.message : 'Unable to remove editor.');
    } finally {
      this.memberPending.set(null);
    }
  }

  async copyUid(userId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(userId);
      this.toasts.success('UID copied.');
    } catch {
      this.toasts.error('Unable to copy the UID.');
    }
  }

  confirmEditorAction(): void {
    const action = this.pendingEditorAction();
    this.pendingEditorAction.set(null);
    this.finishEditing();
    if (action) this.executeEditorAction(action);
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.editing() || !this.editorDirty()) {
      this.finishEditing();
      return true;
    }
    if (this.routeLeavePromise) return this.routeLeavePromise;
    this.pendingEditorAction.set(null);
    this.routeLeavePending.set(true);
    this.routeLeavePromise = new Promise<boolean>((resolve) => {
      this.routeLeaveResolver = resolve;
    });
    return this.routeLeavePromise;
  }

  resolveRouteLeave(allow: boolean): void {
    if (allow) this.finishEditing();
    this.routeLeavePending.set(false);
    this.routeLeaveResolver?.(allow);
    this.routeLeaveResolver = null;
    this.routeLeavePromise = null;
  }

  private requestEditorAction(action: PendingEditorAction): void {
    if (!this.editing()) {
      this.executeEditorAction(action);
      return;
    }
    if (this.editorDirty()) {
      this.pendingEditorAction.set(action);
      return;
    }
    this.finishEditing();
    this.executeEditorAction(action);
  }

  private executeEditorAction(action: PendingEditorAction): void {
    switch (action.type) {
      case 'select-page':
        this.sidebarOpen.set(false);
        void this.store.selectPage(action.index);
        break;
      case 'previous':
        void this.store.previous().then(() => this.scrollToDocumentTop());
        break;
      case 'next':
        void this.store.next().then(() => this.scrollToDocumentTop());
        break;
      case 'select-path':
        void this.store.selectPath(action.path);
        break;
      case 'create-document':
        this.createParent.set(action.parentPath);
        this.createName.set('');
        this.createError.set(null);
        break;
      case 'delete-document':
        this.deleteTarget.set(action.node);
        break;
      case 'logout':
        void this.auth.logout()
          .then(() => this.projects.loadProject(this.projectId()))
          .catch(() => this.toasts.error('Unable to sign out.'));
        break;
    }
  }

  private scrollToDocumentTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
