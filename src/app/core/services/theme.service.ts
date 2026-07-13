import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'edusync.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<ThemeMode>(this.resolveInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  toggleTheme(): void {
    this._theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
  }

  private resolveInitialTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }

    return 'light';
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
    }
  }
}
