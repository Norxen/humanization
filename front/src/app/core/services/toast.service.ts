import { Injectable, OnDestroy, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error', 6000); }
  info(message: string): void { this.show(message, 'info'); }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  ngOnDestroy(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  private show(message: string, kind: ToastMessage['kind'], duration = 4000): void {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, kind, message }]);
    this.timers.set(id, window.setTimeout(() => this.dismiss(id), duration));
  }
}
