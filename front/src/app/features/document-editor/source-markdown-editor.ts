import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output
} from '@angular/core';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  redo,
  undo
} from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { openSearchPanel, search, searchKeymap } from '@codemirror/search';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers
} from '@codemirror/view';
import { DocumentDescriptor } from '../../core/models/document-page.model';
import { ProjectMembership } from '../../core/models/project.model';

@Component({
  selector: 'app-source-markdown-editor',
  template: `<div #host class="codemirror-host"></div>`,
  styles: [`
    :host { display: block; min-height: 0; flex: 1; }
    .codemirror-host { height: 100%; min-height: 620px; }
    .codemirror-host ::ng-deep .cm-editor {
      height: 100%; min-height: 620px; color: var(--ink); background: var(--background);
      font: 13px/1.75 Consolas, "SFMono-Regular", monospace;
    }
    .codemirror-host ::ng-deep .cm-scroller { overflow: auto; }
    .codemirror-host ::ng-deep .cm-content { padding: 24px 20px 90px; caret-color: var(--accent-bright); }
    .codemirror-host ::ng-deep .cm-gutters {
      color: var(--muted); border-right: 1px solid var(--line); background: var(--surface);
    }
    .codemirror-host ::ng-deep .cm-activeLine,
    .codemirror-host ::ng-deep .cm-activeLineGutter { background: var(--accent-soft); }
    .codemirror-host ::ng-deep .cm-selectionBackground { background: rgba(168,85,247,.24) !important; }
    .codemirror-host ::ng-deep .cm-tooltip {
      border: 1px solid var(--line-strong); color: var(--ink); background: var(--surface-raised);
    }
    .codemirror-host ::ng-deep .cm-tooltip-autocomplete > ul > li[aria-selected] {
      color: var(--ink); background: var(--accent-soft);
    }
    .codemirror-host ::ng-deep .cm-search { color: var(--ink); background: var(--surface-raised); }
    .codemirror-host ::ng-deep .cm-search input { color: var(--ink); background: var(--background); }
  `]
})
export class SourceMarkdownEditor implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLElement>;

  readonly value = input.required<string>();
  readonly currentPath = input.required<string>();
  readonly pages = input<DocumentDescriptor[]>([]);
  readonly members = input<ProjectMembership[]>([]);
  readonly valueChange = output<string>();

  private view: EditorView | null = null;
  private lastValue = '';
  private syncing = false;

  constructor() {
    effect(() => {
      const value = this.value();
      if (this.view && value !== this.lastValue) {
        this.syncing = true;
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: value }
        });
        this.lastValue = value;
        this.syncing = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.lastValue = this.value();
    this.view = new EditorView({
      parent: this.host.nativeElement,
      state: EditorState.create({
        doc: this.value(),
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          markdown(),
          syntaxHighlighting(defaultHighlightStyle),
          search(),
          autocompletion({
            override: [(context) => this.complete(context)],
            activateOnTyping: true
          }),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const value = update.state.doc.toString();
            this.lastValue = value;
            if (!this.syncing) this.valueChange.emit(value);
          })
        ]
      })
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }

  openSearch(): void {
    if (this.view) {
      openSearchPanel(this.view);
      this.view.focus();
    }
  }

  execute(command: string): void {
    if (!this.view) return;
    if (command === 'undo' || command === 'redo') {
      (command === 'undo' ? undo : redo)(this.view);
      return;
    }
    const selection = this.view.state.selection.main;
    const selected = this.view.state.sliceDoc(selection.from, selection.to);
    const line = this.view.state.doc.lineAt(selection.from);
    const replacements: Record<string, { from: number; to: number; insert: string; cursor?: number }> = {
      paragraph: { from: line.from, to: line.to, insert: line.text.replace(/^#{1,6}\s+/, '') },
      h2: { from: line.from, to: line.to, insert: `## ${line.text.replace(/^#{1,6}\s+/, '')}` },
      h3: { from: line.from, to: line.to, insert: `### ${line.text.replace(/^#{1,6}\s+/, '')}` },
      h4: { from: line.from, to: line.to, insert: `#### ${line.text.replace(/^#{1,6}\s+/, '')}` },
      h5: { from: line.from, to: line.to, insert: `##### ${line.text.replace(/^#{1,6}\s+/, '')}` },
      h6: { from: line.from, to: line.to, insert: `###### ${line.text.replace(/^#{1,6}\s+/, '')}` },
      bold: this.wrap(selection.from, selection.to, selected, '**', '**', 'bold'),
      italic: this.wrap(selection.from, selection.to, selected, '*', '*', 'italic'),
      strike: this.wrap(selection.from, selection.to, selected, '~~', '~~', 'text'),
      'inline-code': this.wrap(selection.from, selection.to, selected, '`', '`', 'code'),
      'code-block': this.wrap(selection.from, selection.to, selected, '```\n', '\n```', 'code'),
      quote: { from: line.from, to: line.to, insert: `> ${line.text}` },
      bullet: { from: line.from, to: line.to, insert: `- ${line.text}` },
      ordered: { from: line.from, to: line.to, insert: `1. ${line.text}` },
      task: { from: line.from, to: line.to, insert: `- [ ] ${line.text}` },
      rule: { from: selection.from, to: selection.to, insert: '\n---\n' },
      hardbreak: { from: selection.from, to: selection.to, insert: '  \n' },
      table: {
        from: selection.from,
        to: selection.to,
        insert: '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |\n'
      },
      link: this.linkReplacement(selection.from, selection.to, selected),
      image: this.imageReplacement(selection.from, selection.to, selected)
    };
    const replacement = replacements[command];
    if (!replacement) return;
    this.view.dispatch({
      changes: replacement,
      selection: {
        anchor: replacement.from + (replacement.cursor ?? replacement.insert.length)
      }
    });
    this.view.focus();
  }

  focus(): void {
    this.view?.focus();
  }

  private complete(context: CompletionContext) {
    const before = context.matchBefore(/[#@][A-Za-z0-9_./ -]*/);
    if (!before || (before.from === before.to && !context.explicit)) return null;
    const trigger = before.text[0];
    const query = before.text.slice(1).trim().toLowerCase();
    if (trigger === '#') {
      const line = context.state.doc.lineAt(before.from);
      if (before.from === line.from && /^#\s/.test(line.text)) return null;
      return {
        from: before.from,
        options: this.pages()
          .filter((page) =>
            page.path !== this.currentPath()
            && `${page.displayName} ${page.path}`.toLowerCase().includes(query)
          )
          .slice(0, 12)
          .map((page) => ({
            label: `#${page.displayName}`,
            detail: page.path,
            apply: `[${page.displayName}](${this.relativePath(this.currentPath(), page.path)})`
          }))
      };
    }
    return {
      from: before.from,
      options: this.members()
        .filter((member) => member.userId.toLowerCase().includes(query))
        .slice(0, 12)
        .map((member) => ({
          label: `@${member.userId}`,
          detail: member.role,
          apply: `@${member.userId}`
        }))
    };
  }

  private wrap(
    from: number,
    to: number,
    selected: string,
    prefix: string,
    suffix: string,
    placeholder: string
  ) {
    const content = selected || placeholder;
    return {
      from,
      to,
      insert: `${prefix}${content}${suffix}`,
      cursor: prefix.length + content.length
    };
  }

  private linkReplacement(from: number, to: number, selected: string) {
    const href = window.prompt('Link URL or relative Markdown path:', '');
    const label = selected || 'link text';
    return {
      from,
      to,
      insert: href ? `[${label}](${href})` : label,
      cursor: href ? label.length + 1 : label.length
    };
  }

  private imageReplacement(from: number, to: number, selected: string) {
    const src = window.prompt('Image URL:', '');
    const alt = selected || window.prompt('Alternative text:', '') || 'image';
    return {
      from,
      to,
      insert: src ? `![${alt}](${src})` : selected,
      cursor: src ? alt.length + 2 : selected.length
    };
  }

  private relativePath(from: string, to: string): string {
    const fromParts = from.split('/');
    fromParts.pop();
    const toParts = to.split('/');
    while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }
    return encodeURI([...fromParts.map(() => '..'), ...toParts].join('/')).replace(/#/g, '%23');
  }
}
