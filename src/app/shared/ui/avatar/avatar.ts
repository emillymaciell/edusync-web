import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.background]="color()" [style.width.px]="size()" [style.height.px]="size()" [style.fontSize.px]="size() * 0.4">
      {{ initials() }}
    </span>
  `,
  styles: [
    `
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        color: #fff;
        font-weight: 700;
        flex-shrink: 0;
        letter-spacing: -0.01em;
      }
    `,
  ],
})
export class Avatar {
  readonly initials = input.required<string>();
  readonly color = input<string>('#4f46e5');
  readonly size = input<number>(36);
}
