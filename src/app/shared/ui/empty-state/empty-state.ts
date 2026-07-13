import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="icon"><app-icon [name]="icon()" [size]="26" /></span>
      <strong>{{ title() }}</strong>
      <p>{{ description() }}</p>
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        padding: 48px 24px;
        color: var(--color-text-muted);
      }
      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 999px;
        background: var(--color-primary-light);
        color: var(--color-primary);
        margin-bottom: 4px;
      }
      strong {
        color: var(--color-text);
        font-size: 0.95rem;
      }
      p {
        font-size: 0.8125rem;
        max-width: 32ch;
      }
    `,
  ],
})
export class EmptyState {
  readonly icon = input<IconName>('search');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
