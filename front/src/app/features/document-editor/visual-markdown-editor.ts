import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { Editor, defaultValueCtx, editorViewCtx, rootCtx } from '@milkdown/core';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import {
  commonmark,
  createCodeBlockCommand,
  insertHrCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand
} from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { $prose, callCommand, replaceAll } from '@milkdown/utils';
import { redo, undo } from '@milkdown/prose/history';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { DocumentDescriptor } from '../../core/models/document-page.model';
import { ProjectMembership } from '../../core/models/project.model';

type ToolbarCommand =
  | 'paragraph' | 'h2' | 'h3' | 'h4'
  | 'bold' | 'italic' | 'bullet' | 'ordered'
  | 'link' | 'inline-code' | 'code-block'
  | 'quote' | 'rule' | 'undo' | 'redo';

interface CompletionItem {
  kind: 'document' | 'member';
  label: string;
  detail: string;
  path?: string;
  userId?: string;
}

@Component({
  selector: 'app-visual-markdown-editor',
  template: `
    <div
      #host
      class="milkdown-host"
      role="textbox"
      aria-label="Visual Markdown editor"
      aria-multiline="true"
      (keydown)="handleKeydown($event)"
      (keyup)="refreshCompletion()"
    ></div>
    @if (completionItems().length) {
      <div class="completion-menu" role="listbox" aria-label="Editor suggestions">
        @for (item of completionItems(); track item.kind + item.label; let index = $index) {
          <button
            type="button"
            role="option"
            [class.active]="index === completionIndex()"
            [attr.aria-selected]="index === completionIndex()"
            (mousedown)="$event.preventDefault(); applyCompletion(item)"
          >
            <strong>{{ item.kind === 'document' ? '#' : '@' }}{{ item.label }}</strong>
            <small>{{ item.detail }}</small>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host { position: relative; display: block; min-height: 0; flex: 1; }
    .milkdown-host { min-height: 100%; height: 100%; overflow: auto; outline: none; }
    .milkdown-host ::ng-deep .milkdown { min-height: 100%; }
    .milkdown-host ::ng-deep .ProseMirror {
      min-height: 620px; padding: 38px clamp(24px, 6vw, 80px) 100px;
      color: var(--ink); outline: none; caret-color: var(--accent-bright);
      font: 15px/1.8 Inter, ui-sans-serif, sans-serif;
    }
    .milkdown-host ::ng-deep .ProseMirror h1 { font-size: 2.5rem; letter-spacing: -.04em; }
    .milkdown-host ::ng-deep .ProseMirror h2 { margin-top: 2em; border-bottom: 1px solid var(--line); }
    .milkdown-host ::ng-deep .ProseMirror a { color: var(--accent-bright); text-decoration: underline; }
    .milkdown-host ::ng-deep .ProseMirror .valid-mention {
      padding: 1px 4px; border-radius: 5px; color: var(--accent-bright);
      background: var(--accent-soft); font-weight: 650;
    }
    .milkdown-host ::ng-deep .ProseMirror code {
      padding: 2px 5px; border-radius: 4px; color: var(--accent-bright); background: var(--accent-soft);
    }
    .milkdown-host ::ng-deep .ProseMirror pre {
      padding: 18px; overflow: auto; border: 1px solid var(--line);
      border-radius: 9px; background: var(--surface-raised);
    }
    .milkdown-host ::ng-deep .ProseMirror blockquote {
      margin-left: 0; padding-left: 18px; border-left: 3px solid var(--accent);
      color: var(--muted);
    }
    .milkdown-host ::ng-deep .ProseMirror table { width: 100%; border-collapse: collapse; }
    .milkdown-host ::ng-deep .ProseMirror th,
    .milkdown-host ::ng-deep .ProseMirror td { padding: 8px 10px; border: 1px solid var(--line); }
    .completion-menu {
      position: absolute; z-index: 40; top: 54px; left: clamp(24px, 6vw, 80px);
      width: min(360px, calc(100% - 48px)); max-height: 260px; overflow: auto;
      padding: 5px; border: 1px solid var(--line-strong); border-radius: 10px;
      background: var(--surface-raised); box-shadow: 0 18px 46px rgba(0,0,0,.24);
    }
    .completion-menu button {
      width: 100%; display: grid; gap: 2px; padding: 9px 10px; border: 0;
      border-radius: 7px; color: var(--ink); background: transparent; text-align: left; cursor: pointer;
    }
    .completion-menu button.active,
    .completion-menu button:hover { background: var(--accent-soft); }
    .completion-menu small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; }
  `]
})
export class VisualMarkdownEditor implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLElement>;

  readonly value = input.required<string>();
  readonly currentPath = input.required<string>();
  readonly pages = input<DocumentDescriptor[]>([]);
  readonly members = input<ProjectMembership[]>([]);
  readonly valueChange = output<string>();
  readonly completionItems = signal<CompletionItem[]>([]);
  readonly completionIndex = signal(0);

  private editor: Editor | null = null;
  private lastMarkdown = '';
  private syncing = false;
  private triggerRange: { from: number; to: number } | null = null;
  private readonly mentionDecorationsKey = new PluginKey('mention-decorations');

  constructor() {
    effect(() => {
      const next = this.value();
      this.members();
      if (this.editor && next !== this.lastMarkdown) {
        this.syncing = true;
        this.editor.action(replaceAll(next));
        this.lastMarkdown = next;
        this.syncing = false;
      } else if (this.editor) {
        this.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          view.dispatch(view.state.tr.setMeta(this.mentionDecorationsKey, true));
        });
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.lastMarkdown = this.value();
    const mentionDecorations = $prose(() => new Plugin({
      key: this.mentionDecorationsKey,
      props: {
        decorations: (state) => {
          const members = new Set(this.members().map((member) => member.userId));
          const decorations: Decoration[] = [];
          state.doc.descendants((node, position) => {
            if (!node.isText || !node.text) return;
            for (const match of node.text.matchAll(/@([A-Za-z0-9_-]{1,128})\b/g)) {
              if (!members.has(match[1]) || match.index === undefined) continue;
              const from = position + match.index;
              decorations.push(
                Decoration.inline(from, from + match[0].length, {
                  class: 'valid-mention'
                })
              );
            }
          });
          return DecorationSet.create(state.doc, decorations);
        }
      }
    }));
    this.editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, this.host.nativeElement);
        ctx.set(defaultValueCtx, this.value());
        ctx.get(listenerCtx).markdownUpdated((_context, markdown) => {
          this.lastMarkdown = markdown;
          if (!this.syncing) {
            this.valueChange.emit(markdown);
          }
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(mentionDecorations)
      .create();
  }

  ngOnDestroy(): void {
    void this.editor?.destroy();
  }

  execute(command: ToolbarCommand): void {
    if (!this.editor) return;
    const actions: Record<ToolbarCommand, () => void> = {
      paragraph: () => this.editor!.action(callCommand(turnIntoTextCommand.key)),
      h2: () => this.editor!.action(callCommand(wrapInHeadingCommand.key, 2)),
      h3: () => this.editor!.action(callCommand(wrapInHeadingCommand.key, 3)),
      h4: () => this.editor!.action(callCommand(wrapInHeadingCommand.key, 4)),
      bold: () => this.editor!.action(callCommand(toggleStrongCommand.key)),
      italic: () => this.editor!.action(callCommand(toggleEmphasisCommand.key)),
      bullet: () => this.editor!.action(callCommand(wrapInBulletListCommand.key)),
      ordered: () => this.editor!.action(callCommand(wrapInOrderedListCommand.key)),
      'inline-code': () => this.editor!.action(callCommand(toggleInlineCodeCommand.key)),
      'code-block': () => this.editor!.action(callCommand(createCodeBlockCommand.key)),
      quote: () => this.editor!.action(callCommand(wrapInBlockquoteCommand.key)),
      rule: () => this.editor!.action(callCommand(insertHrCommand.key)),
      undo: () => this.runHistory(undo),
      redo: () => this.runHistory(redo),
      link: () => this.addLink()
    };
    actions[command]();
    this.focus();
  }

  focus(): void {
    this.editor?.action((ctx) => ctx.get(editorViewCtx).focus());
  }

  refreshCompletion(): void {
    if (!this.editor) return;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { $from } = view.state.selection;
      const before = $from.parent.textBetween(0, $from.parentOffset, '\n', '\0');
      const match = before.match(/(?:^|\s)([#@])([A-Za-z0-9_./ -]{1,80})$/);
      if (!match || (match[1] === '#' && /^\s*#\s/.test(before))) {
        this.closeCompletion();
        return;
      }
      const query = match[2].trim().toLowerCase();
      const items = match[1] === '#'
        ? this.pages()
            .filter((page) =>
              page.path !== this.currentPath()
              && `${page.displayName} ${page.path}`.toLowerCase().includes(query)
            )
            .slice(0, 8)
            .map((page) => ({
              kind: 'document' as const,
              label: page.displayName,
              detail: page.path,
              path: page.path
            }))
        : this.members()
            .filter((member) => member.userId.toLowerCase().includes(query))
            .slice(0, 8)
            .map((member) => ({
              kind: 'member' as const,
              label: member.userId,
              detail: member.role,
              userId: member.userId
            }));
      this.triggerRange = {
        from: view.state.selection.from - match[1].length - match[2].length,
        to: view.state.selection.from
      };
      this.completionItems.set(items);
      this.completionIndex.set(0);
    });
  }

  handleKeydown(event: KeyboardEvent): void {
    const items = this.completionItems();
    if (!items.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      this.completionIndex.set(
        (this.completionIndex() + direction + items.length) % items.length
      );
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      this.applyCompletion(items[this.completionIndex()]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCompletion();
    }
  }

  applyCompletion(item: CompletionItem): void {
    if (!this.editor || !this.triggerRange) return;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { schema, tr } = view.state;
      if (item.kind === 'document' && item.path) {
        const href = this.relativePath(this.currentPath(), item.path);
        const mark = schema.marks['link'].create({ href });
        view.dispatch(
          tr.replaceWith(
            this.triggerRange!.from,
            this.triggerRange!.to,
            schema.text(item.label, [mark])
          ).scrollIntoView()
        );
      } else if (item.userId) {
        view.dispatch(
          tr.insertText(`@${item.userId}`, this.triggerRange!.from, this.triggerRange!.to)
            .scrollIntoView()
        );
      }
      view.focus();
    });
    this.closeCompletion();
  }

  private addLink(): void {
    if (!this.editor) return;
    const href = window.prompt('Link URL or relative Markdown path:', '');
    if (!href) return;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const mark = view.state.schema.marks['link'].create({ href });
      const transaction = view.state.tr;
      if (view.state.selection.empty) {
        transaction.insertText(href);
      }
      transaction.addMark(
        transaction.selection.from,
        transaction.selection.to,
        mark
      );
      view.dispatch(transaction.scrollIntoView());
    });
  }

  private runHistory(command: typeof undo): void {
    if (!this.editor) return;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      command(view.state, view.dispatch);
    });
  }

  private closeCompletion(): void {
    this.triggerRange = null;
    this.completionItems.set([]);
  }

  private relativePath(from: string, to: string): string {
    const fromParts = from.split('/');
    fromParts.pop();
    const toParts = to.split('/');
    while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }
    const path = [...fromParts.map(() => '..'), ...toParts].join('/');
    return encodeURI(path).replace(/#/g, '%23');
  }
}
