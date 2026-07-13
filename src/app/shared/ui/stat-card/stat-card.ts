import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card card">
      <span class="icon-wrap" [style.background]="tintBg()" [style.color]="tint()">
        <app-icon [name]="icon()" [size]="20" />
      </span>
      <div class="stat-copy">
        <strong>{{ value() }}</strong>
        <span>{{ label() }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px;
      }
      .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
        flex-shrink: 0;
      }
      .stat-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .stat-copy strong {
        font-size: 1.5rem;
        font-weight: 800;
        line-height: 1.1;
      }
      .stat-copy span {
        font-size: 0.8125rem;
        color: var(--color-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class StatCard {
  readonly icon = input.required<IconName>();
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
  readonly tint = input<string>('#4f46e5');
  readonly tintBg = input<string>('#eef2ff');
}
