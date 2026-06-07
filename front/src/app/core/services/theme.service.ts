import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  toggle(): void {
    const nextTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(nextTheme);
    this.applyTheme(nextTheme);
    localStorage.setItem('manuscript-theme', nextTheme);
  }

  private initialTheme(): Theme {
    const storedTheme = localStorage.getItem('manuscript-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme;
    document.documentElement.style.colorScheme = theme;
  }
}
