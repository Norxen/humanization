import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import {
  DocumentDescriptor,
  LoadedDocument,
  StoredDocument
} from '../../core/models/document-page.model';
import { MarkdownRendererService } from '../../core/services/markdown-renderer.service';
import { DocumentationStore } from '../../core/services/documentation-store.service';
import { DocumentConflictError } from '../../core/repositories/document.repository';
import { ProjectMembership } from '../../core/models/project.model';
import { VisualMarkdownEditor } from './visual-markdown-editor';
import { SourceMarkdownEditor } from './source-markdown-editor';
import { Modal } from '../../shared/modal/modal';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';

interface LocalDraft {
  body: string;
  baseVersion: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Component({
  selector: 'app-document-editor',
  imports: [VisualMarkdownEditor, SourceMarkdownEditor, Modal, ConfirmDialog],
  templateUrl: './document-editor.html',
  styleUrl: './document-editor.css'
})
export class DocumentEditor implements OnInit, OnDestroy {
  @ViewChild(VisualMarkdownEditor) private visualEditor?: VisualMarkdownEditor;
  @ViewChild(SourceMarkdownEditor) private sourceEditor?: SourceMarkdownEditor;
  private readonly renderer = inject(MarkdownRendererService);
  private readonly store = inject(DocumentationStore);
  private readonly toasts = inject(ToastService);
  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  readonly document = input.required<LoadedDocument>();
  readonly pages = input.required<DocumentDescriptor[]>();
  readonly members = input<ProjectMembership[]>([]);
  readonly projectId = input.required<string>();
  readonly cancelled = output<void>();
  readonly saved = output<LoadedDocument>();
  readonly dirtyChanged = output<boolean>();

  readonly body = signal('');
  readonly baseBody = signal('');
  readonly baseVersion = signal(0);
  readonly preview = signal<SafeHtml>('');
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly conflict = signal<{ local: string; latest: StoredDocument } | null>(null);
  readonly mode = signal<'edit' | 'markdown' | 'preview'>('edit');
  readonly insertDialog = signal<'link' | 'image' | null>(null);
  readonly insertUrl = signal('');
  readonly imageAlt = signal('');
  readonly cancelConfirmation = signal(false);
  readonly latestConfirmation = signal(false);
  readonly mergeAcknowledged = signal(false);
  readonly pendingDraft = signal<LocalDraft | null>(null);
  readonly validation = computed(() => this.validate(this.body()));
  readonly dirty = computed(() => this.body() !== this.baseBody());
  readonly mergeChanged = computed(() => {
    const conflict = this.conflict();
    return Boolean(conflict) && this.body() !== conflict!.local;
  });
  readonly canSave = computed(
    () => this.dirty() && this.validation().valid && !this.saving() && !this.conflict()
  );

  ngOnInit(): void {
    const current = this.document();
    const draft = this.readDraft(current.descriptor.path);
    this.pendingDraft.set(draft);
    this.body.set(current.markdown);
    this.baseBody.set(current.markdown);
    this.baseVersion.set(current.version);
    this.dirtyChanged.emit(this.dirty());
    this.schedulePreview();
  }

  ngOnDestroy(): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
    }
  }

  updateBody(value: string): void {
    this.body.set(value);
    this.saveDraft();
    this.dirtyChanged.emit(this.dirty());
    this.saveError.set(null);
    this.schedulePreview();
  }

  setMode(mode: 'edit' | 'markdown' | 'preview'): void {
    this.mode.set(mode);
    if (mode === 'preview') this.schedulePreview();
    setTimeout(() => {
      mode === 'edit' ? this.visualEditor?.focus() : this.sourceEditor?.focus();
    });
  }

  runToolbar(command: string): void {
    if (command === 'link' || command === 'image') {
      if (this.mode() === 'preview') this.setMode('edit');
      this.insertUrl.set('');
      this.imageAlt.set('');
      this.insertDialog.set(command);
      return;
    }
    if (command === 'search') {
      this.setMode('markdown');
      setTimeout(() => this.sourceEditor?.openSearch());
      return;
    }
    if (this.mode() === 'preview') {
      this.setMode('edit');
      setTimeout(() => this.visualEditor?.execute(command as never));
      return;
    }
    this.mode() === 'markdown'
      ? this.sourceEditor?.execute(command)
      : this.visualEditor?.execute(command as never);
  }

  preserveVisualSelection(event: MouseEvent): void {
    if (
      this.mode() === 'edit'
      && event.target instanceof Element
      && event.target.closest('button')
    ) {
      event.preventDefault();
    }
  }

  async saveDocument(): Promise<void> {
    if (!this.canSave()) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const saved = await this.store.saveCurrent(this.body(), this.baseVersion());
      this.baseBody.set(saved.markdown);
      this.baseVersion.set(saved.version);
      this.body.set(saved.markdown);
      this.clearDraft();
      this.dirtyChanged.emit(false);
      this.saved.emit(saved);
    } catch (error) {
      if (error instanceof DocumentConflictError) {
        this.mergeAcknowledged.set(false);
        this.conflict.set({
          local: this.body(),
          latest: error.latest
        });
      } else {
        this.saveError.set(error instanceof Error ? error.message : 'Unable to save document.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    if (this.dirty()) {
      this.cancelConfirmation.set(true);
      return;
    }
    this.completeCancel();
  }

  completeCancel(): void {
    this.clearDraft();
    this.dirtyChanged.emit(false);
    this.cancelConfirmation.set(false);
    this.cancelled.emit();
  }

  acceptManualMerge(): void {
    const conflict = this.conflict();
    if (!conflict || !this.mergeChanged() || !this.mergeAcknowledged()) return;
    this.baseBody.set(conflict.latest.body);
    this.baseVersion.set(conflict.latest.version);
    this.conflict.set(null);
    this.mergeAcknowledged.set(false);
    this.saveDraft();
    this.dirtyChanged.emit(this.dirty());
    this.schedulePreview();
    this.toasts.info('Manual merge accepted. Review the result, then save it as a new version.');
  }

  confirmUseLatest(): void {
    const conflict = this.conflict();
    if (!conflict) return;
    this.body.set(conflict.latest.body);
    this.baseBody.set(conflict.latest.body);
    this.baseVersion.set(conflict.latest.version);
    this.conflict.set(null);
    this.latestConfirmation.set(false);
    this.mergeAcknowledged.set(false);
    this.clearDraft();
    this.dirtyChanged.emit(false);
    this.schedulePreview();
    this.toasts.success('Loaded the latest Firestore version.');
  }

  restoreDraft(): void {
    const draft = this.pendingDraft();
    if (!draft) return;
    this.body.set(draft.body);
    this.baseVersion.set(draft.baseVersion);
    this.pendingDraft.set(null);
    this.dirtyChanged.emit(this.dirty());
    this.schedulePreview();
  }

  discardDraft(): void {
    this.pendingDraft.set(null);
    this.clearDraft();
  }

  applyInsert(): void {
    const dialog = this.insertDialog();
    const url = this.insertUrl().trim();
    if (!dialog || !url) return;
    if (this.mode() === 'markdown') {
      dialog === 'link'
        ? this.sourceEditor?.insertLink(url)
        : this.sourceEditor?.insertImage(url, this.imageAlt().trim());
    } else {
      dialog === 'link'
        ? this.visualEditor?.insertLink(url)
        : this.visualEditor?.insertImage(url, this.imageAlt().trim());
    }
    this.insertDialog.set(null);
  }

  async copyLatest(): Promise<void> {
    const latest = this.conflict()?.latest.body;
    if (!latest) return;
    try {
      await navigator.clipboard.writeText(latest);
      this.toasts.success('Latest version copied to the clipboard.');
    } catch {
      this.toasts.error('The browser could not copy the latest version.');
    }
  }

  handlePreviewClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const viewButton = target.closest<HTMLButtonElement>(
      '.plantuml-show-diagram, .plantuml-show-source'
    );
    if (viewButton) {
      this.togglePlantUmlView(viewButton);
      return;
    }

    if (target.closest('a[href]')) {
      event.preventDefault();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (!this.dirty()) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  }

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.saveDocument();
    }
  }

  private schedulePreview(): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
    }
    this.previewTimer = setTimeout(async () => {
      this.preview.set(
        await this.renderer.render(this.body(), this.document().descriptor)
      );
    }, 250);
  }

  private validate(body: string): ValidationResult {
    const errors: string[] = [];
    const byteLength = new TextEncoder().encode(body).byteLength;
    if (!body.trim()) {
      errors.push('Document content cannot be empty.');
    }
    if (byteLength > 500 * 1024) {
      errors.push('Document content must be smaller than 500 KiB.');
    }

    const headings = [...body.matchAll(/^#\s+(.+)$/gm)];
    const expectedTitle = this.document().descriptor.name.replace(/\.md$/i, '');
    if (headings.length !== 1) {
      errors.push('Document content must contain exactly one H1 heading.');
    } else if (headings[0][1].trim() !== expectedTitle) {
      errors.push(`The H1 heading must be "${expectedTitle}".`);
    }

    const knownPaths = new Set(this.pages().map((page) => page.path));
    for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#', 1)[0];
      if (
        !target ||
        /^(?:[a-z]+:|\/|#)/i.test(target) ||
        !target.toLowerCase().endsWith('.md')
      ) {
        continue;
      }
      const resolved = this.resolvePath(this.document().descriptor.path, target);
      if (!knownPaths.has(resolved)) {
        errors.push(`Broken internal Markdown link: ${target}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private resolvePath(documentPath: string, target: string): string {
    const directory = documentPath.includes('/')
      ? documentPath.slice(0, documentPath.lastIndexOf('/'))
      : '';
    let decodedTarget = target;
    try {
      decodedTarget = decodeURIComponent(target);
    } catch {
      return target;
    }
    const segments = `${directory}/${decodedTarget}`.split('/');
    const resolved: string[] = [];
    for (const segment of segments) {
      if (!segment || segment === '.') {
        continue;
      }
      segment === '..' ? resolved.pop() : resolved.push(segment);
    }
    return resolved.join('/');
  }

  private draftKey(): string {
    return `manuscript-draft:${this.projectId()}:${this.document().descriptor.path}`;
  }

  private readDraft(path: string): LocalDraft | null {
    const key = `manuscript-draft:${this.projectId()}:${path}`;
    const value = localStorage.getItem(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as LocalDraft;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private saveDraft(): void {
    if (!this.dirty()) {
      this.clearDraft();
      return;
    }
    localStorage.setItem(
      this.draftKey(),
      JSON.stringify({
        body: this.body(),
        baseVersion: this.baseVersion()
      } satisfies LocalDraft)
    );
  }

  private clearDraft(): void {
    localStorage.removeItem(this.draftKey());
  }

  private togglePlantUmlView(button: HTMLButtonElement): void {
    const figure = button.closest('.plantuml-block');
    const diagram = figure?.querySelector('.plantuml-diagram');
    const source = figure?.querySelector('.plantuml-source');
    const diagramButton = figure?.querySelector<HTMLButtonElement>('.plantuml-show-diagram');
    const sourceButton = figure?.querySelector<HTMLButtonElement>('.plantuml-show-source');
    if (!diagram || !source || !diagramButton || !sourceButton) {
      return;
    }

    const showSource = button.classList.contains('plantuml-show-source');
    diagram.classList.toggle('is-hidden', showSource);
    source.classList.toggle('is-hidden', !showSource);
    diagramButton.classList.toggle('active', !showSource);
    sourceButton.classList.toggle('active', showSource);
    diagramButton.setAttribute('aria-pressed', String(!showSource));
    sourceButton.setAttribute('aria-pressed', String(showSource));
  }
}
