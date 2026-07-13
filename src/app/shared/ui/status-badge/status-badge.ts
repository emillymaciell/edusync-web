import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'tone-' + tone()">{{ label() }}</span>`,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        line-height: 1.6;
      }
      .badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: currentColor;
      }
      .tone-success {
        background: var(--color-success-bg);
        color: var(--color-success);
      }
      .tone-warning {
        background: var(--color-warning-bg);
        color: var(--color-warning);
      }
      .tone-danger {
        background: var(--color-danger-bg);
        color: var(--color-danger);
      }
      .tone-info {
        background: var(--color-info-bg);
        color: var(--color-info);
      }
      .tone-neutral {
        background: var(--color-neutral-bg);
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
}

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  ativo: 'success',
  'em dia': 'success',
  publicada: 'success',
  concluido: 'success',
  concluído: 'success',
  corrigida: 'success',
  atenção: 'warning',
  atencao: 'warning',
  pendente: 'warning',
  agendada: 'info',
  'em breve': 'warning',
  rascunho: 'neutral',
  'em risco': 'danger',
  atrasada: 'danger',
  bloqueado: 'neutral',
  finalizada: 'neutral',
  entregue: 'info',
  enviada: 'info',
  atual: 'info',
};

export function toneForStatus(status: string): BadgeTone {
  return STATUS_TONE_MAP[status.toLowerCase()] ?? 'neutral';
}
