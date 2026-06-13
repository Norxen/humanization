import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal
} from '@angular/core';

@Component({
  selector: 'app-context-menu',
  template: `
    <div
      #menu
      class="context-menu"
      role="menu"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      (pointerdown)="$event.stopPropagation()"
    ><ng-content /></div>
  `,
  styleUrl: './context-menu.css'
})
export class ContextMenu implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  @ViewChild('menu', { static: true }) private menu!: ElementRef<HTMLElement>;
  readonly anchor = input.required<HTMLElement>();
  readonly closed = output<void>();
  readonly position = signal({ x: 8, y: 8 });

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.updatePosition();
      this.items()[0]?.focus();
    });
  }

  ngOnDestroy(): void {
    this.anchor().focus();
  }

  @HostListener('document:pointerdown', ['$event'])
  closeOutside(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  navigateMenu(event: KeyboardEvent): void {
    const items = this.items();
    if (!items.length) return;
    const currentIndex = Math.max(0, items.indexOf(document.activeElement as HTMLElement));
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (event.key === 'Tab') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    items[nextIndex].focus();
  }

  @HostListener('window:resize')
  reposition(): void {
    this.updatePosition();
  }

  private updatePosition(): void {
    const margin = 8;
    const gap = 4;
    const anchor = this.anchor().getBoundingClientRect();
    const menu = this.menu.nativeElement.getBoundingClientRect();
    const x = Math.min(
      Math.max(margin, anchor.right - menu.width),
      window.innerWidth - menu.width - margin
    );
    const roomBelow = window.innerHeight - anchor.bottom - margin;
    const y = roomBelow >= menu.height
      ? anchor.bottom + gap
      : Math.max(margin, anchor.top - menu.height - gap);
    this.position.set({ x, y });
  }

  private items(): HTMLElement[] {
    return Array.from(
      this.menu.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')
    );
  }
}
