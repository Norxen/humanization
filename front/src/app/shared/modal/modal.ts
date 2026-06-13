import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  input,
  output,
  signal
} from '@angular/core';

let openModalCount = 0;
let nextModalId = 1;

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal implements AfterViewInit, OnDestroy {
  @ViewChild('panel', { static: true }) private panel!: ElementRef<HTMLElement>;

  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly dirty = input(false);
  readonly pending = input(false);
  readonly dismissible = input(true);
  readonly alert = input(false);
  readonly discardMessage = input('Discard your unsaved changes?');
  readonly closed = output<void>();
  readonly discardOpen = signal(false);
  readonly titleId = `shared-modal-title-${nextModalId++}`;

  private previousFocus: HTMLElement | null = null;
  private modalDepth = 0;

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement as HTMLElement | null;
    openModalCount += 1;
    this.modalDepth = openModalCount;
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => this.focusFirst());
  }

  ngOnDestroy(): void {
    openModalCount = Math.max(0, openModalCount - 1);
    if (!openModalCount) document.body.style.overflow = '';
    this.previousFocus?.focus();
  }

  requestClose(): void {
    if (this.pending() || !this.dismissible()) return;
    if (this.dirty()) {
      this.discardOpen.set(true);
      return;
    }
    this.closed.emit();
  }

  confirmDiscard(): void {
    this.discardOpen.set(false);
    this.closed.emit();
  }

  closeFromBackdrop(event: PointerEvent): void {
    if (event.target === event.currentTarget) this.requestClose();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (this.modalDepth !== openModalCount) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.discardOpen() ? this.discardOpen.set(false) : this.requestClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = this.focusableElements();
    if (!focusable.length) {
      event.preventDefault();
      this.panel.nativeElement.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirst(): void {
    const preferred = this.panel.nativeElement.querySelector<HTMLElement>('[autofocus]');
    (preferred ?? this.focusableElements()[0] ?? this.panel.nativeElement).focus();
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(
      this.panel.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hidden && element.offsetParent !== null);
  }
}
