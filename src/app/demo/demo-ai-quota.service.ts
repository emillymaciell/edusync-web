import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const OBSOLETE_COUNT_KEY = 'edusync.demo.ai.count';

@Injectable({ providedIn: 'root' })
export class DemoAiQuotaService {
  readonly limit = environment.aiLimit;
  private readonly remainingCount = signal<number | null>(null);
  private readonly enabled = signal<boolean | null>(null);

  readonly remaining = this.remainingCount.asReadonly();
  readonly aiEnabled = this.enabled.asReadonly();

  setRemaining(value: number): void {
    if (!Number.isFinite(value)) return;
    const whole = Math.max(0, Math.floor(value));
    this.remainingCount.set(Math.min(whole, this.limit));
  }

  applyHeader(raw: string | null): void {
    if (raw == null) return;
    const parsed = Number(raw.trim());
    if (!Number.isInteger(parsed)) return;
    this.setRemaining(parsed);
  }

  applyPing(body: unknown): void {
    if (!isRecord(body)) return;
    if (typeof body['aiEnabled'] === 'boolean') {
      this.enabled.set(body['aiEnabled']);
    }
    if (typeof body['remaining'] === 'number') {
      this.setRemaining(body['remaining']);
    }
  }

  /** Apaga o contador local antigo. A cota exibida só muda com ping ou header. */
  discardStoredCount(): void {
    try {
      sessionStorage.removeItem(OBSOLETE_COUNT_KEY);
    } catch {
      // O navegador pode bloquear o storage. A cota não depende dele.
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
