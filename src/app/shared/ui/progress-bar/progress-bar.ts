import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track" [style.height.px]="height()">
      <div class="fill" [style.width.%]="clamped()" [style.background]="color()"></div>
    </div>
  `,
  styles: [
    `
      .track {
        width: 100%;
        background: var(--color-neutral-bg);
        border-radius: 999px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.4s ease;
      }
    `,
  ],
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly height = input<number>(6);
  readonly color = input<string>('var(--color-primary)');

  readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
}
