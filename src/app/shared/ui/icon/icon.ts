import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'users'
  | 'user'
  | 'book'
  | 'layers'
  | 'chart'
  | 'sparkles'
  | 'calendar'
  | 'video'
  | 'clipboard'
  | 'search'
  | 'plus'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'logout'
  | 'check-circle'
  | 'alert-triangle'
  | 'play'
  | 'external-link'
  | 'shield'
  | 'menu'
  | 'close'
  | 'upload'
  | 'eye'
  | 'clock'
  | 'flame'
  | 'trophy'
  | 'star'
  | 'graduation-cap'
  | 'link'
  | 'edit'
  | 'trash'
  | 'file'
  | 'send'
  | 'lock'
  | 'bell'
  | 'arrow-right'
  | 'code'
  | 'music'
  | 'download'
  | 'ban'
  | 'sun'
  | 'moon';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="app-icon"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('home') {
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9h12v-9" />
          <path d="M10 19v-5h4v5" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M15.8 13.8c2.5.3 4.2 2.3 4.2 5" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
        }
        @case ('book') {
          <path d="M4 5.5c2.2-1 5-1 8 .5v13c-3-1.5-5.8-1.5-8-.5Z" />
          <path d="M20 5.5c-2.2-1-5-1-8 .5v13c3-1.5 5.8-1.5 8-.5Z" />
        }
        @case ('layers') {
          <path d="M12 3 3 8l9 5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        }
        @case ('chart') {
          <path d="M4 20V10" />
          <path d="M12 20V4" />
          <path d="M20 20v-7" />
          <path d="M3 20h18" />
        }
        @case ('sparkles') {
          <path d="M12 3v4M12 17v4M4 12h4M16 12h4" />
          <path d="m6.5 6.5 2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
          <circle cx="12" cy="12" r="2.2" />
        }
        @case ('calendar') {
          <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" />
          <path d="M4 10h16" />
          <path d="M8 3.5v4M16 3.5v4" />
        }
        @case ('video') {
          <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
          <path d="M15.5 10.5 21 7.8v8.4l-5.5-2.7Z" />
        }
        @case ('clipboard') {
          <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
          <rect x="9" y="3" width="6" height="3" rx="1" />
          <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" />
        }
        @case ('search') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m20 20-4.8-4.8" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('chevron-right') {
          <path d="m9 5 7 7-7 7" />
        }
        @case ('chevron-left') {
          <path d="m15 5-7 7 7 7" />
        }
        @case ('chevron-down') {
          <path d="m5 9 7 7 7-7" />
        }
        @case ('logout') {
          <path d="M9 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H9" />
          <path d="M14 16l4.5-4-4.5-4" />
          <path d="M18.2 12H9" />
        }
        @case ('check-circle') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.2 12.3 2.5 2.5 5-5.2" />
        }
        @case ('alert-triangle') {
          <path d="M12 4.2 21 19H3Z" />
          <path d="M12 10v4" />
          <path d="M12 17.2v.1" />
        }
        @case ('play') {
          <path d="M8 5.5v13l11-6.5Z" />
        }
        @case ('external-link') {
          <path d="M8.5 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" />
          <path d="M13 4h7v7" />
          <path d="M20 4 11 13" />
        }
        @case ('shield') {
          <path d="M12 3.5 5 6v6c0 4.4 2.9 7.6 7 8.5 4.1-.9 7-4.1 7-8.5V6Z" />
          <path d="m9.2 12 2 2 3.6-4" />
        }
        @case ('menu') {
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        }
        @case ('close') {
          <path d="m6 6 12 12M18 6 6 18" />
        }
        @case ('upload') {
          <path d="M12 15.5V4.5" />
          <path d="m7.5 9 4.5-4.5L16.5 9" />
          <path d="M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16" />
        }
        @case ('eye') {
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.6" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3.2 2" />
        }
        @case ('flame') {
          <path d="M12 3.5c1.5 2.5-1.8 3.8-1.8 6.8a3.8 3.8 0 1 0 7.6 0c0-1.8-1-3-1.9-4.1.4 2-.9 2.9-1.5 2.1-.5-.8.3-1.6-.3-3-.5-1.1-1.4-1.5-2.1-1.8Z" />
          <path d="M9.3 13.8a3.8 3.8 0 0 0 3.8 3.9" />
        }
        @case ('trophy') {
          <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
          <path d="M7 6H4.5A2.5 2.5 0 0 0 7 10" />
          <path d="M17 6h2.5A2.5 2.5 0 0 1 17 10" />
          <path d="M12 14v3M9 20.5h6M9.5 20.5V17h5v3.5" />
        }
        @case ('star') {
          <path
            d="m12 3.5 2.6 5.4 5.9.7-4.4 4.1 1.2 5.8L12 16.6l-5.3 2.9 1.2-5.8-4.4-4.1 5.9-.7Z"
          />
        }
        @case ('graduation-cap') {
          <path d="M12 4 2.5 9 12 14l9.5-5Z" />
          <path d="M6 11.3v4.6c0 1.6 2.7 3.1 6 3.1s6-1.5 6-3.1v-4.6" />
          <path d="M21.5 9v6" />
        }
        @case ('link') {
          <path d="M9.5 14.5 14.5 9.5" />
          <path d="M11 7.2 13 5a3.5 3.5 0 0 1 5 5l-2.2 2" />
          <path d="M13 16.8 11 19a3.5 3.5 0 0 1-5-5l2.2-2" />
        }
        @case ('edit') {
          <path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0 0-3L18.8 6a2.1 2.1 0 0 0-3 0L5 15.8Z" />
          <path d="m14.5 7.5 3 3" />
        }
        @case ('trash') {
          <path d="M5 7h14" />
          <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
          <path d="M7 7v11.5A1.5 1.5 0 0 0 8.5 20h7a1.5 1.5 0 0 0 1.5-1.5V7" />
          <path d="M10.5 11v5M13.5 11v5" />
        }
        @case ('file') {
          <path d="M7 3.5h7l4 4v13H7Z" />
          <path d="M14 3.5v4h4" />
        }
        @case ('send') {
          <path d="M20.5 3.5 3 10.2l7 2.8 2.8 7Z" />
          <path d="M20.5 3.5 12.8 13" />
        }
        @case ('lock') {
          <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
          <path d="M8.2 10.5V7.8a3.8 3.8 0 1 1 7.6 0v2.7" />
        }
        @case ('bell') {
          <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        }
        @case ('arrow-right') {
          <path d="M4 12h16" />
          <path d="m13 5 7 7-7 7" />
        }
        @case ('code') {
          <path d="m9 8-4.5 4L9 16" />
          <path d="m15 8 4.5 4L15 16" />
        }
        @case ('music') {
          <path d="M9 18.5V6l10-2v12.5" />
          <circle cx="6.5" cy="18.5" r="2.5" />
          <circle cx="16.5" cy="16.5" r="2.5" />
        }
        @case ('download') {
          <path d="M12 3.5v11.5" />
          <path d="m7.5 11 4.5 4.5L16.5 11" />
          <path d="M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16" />
        }
        @case ('ban') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="m6.5 6.5 11 11" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4.2" />
          <path
            d="M12 2.8v2.6M12 18.6v2.6M4.2 12H1.6M22.4 12h-2.6M6 6l1.8 1.8M16.2 16.2 18 18M18 6l-1.8 1.8M7.8 16.2 6 18"
          />
        }
        @case ('moon') {
          <path d="M20.5 14.5A8.8 8.8 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
      .app-icon {
        display: block;
      }
    `,
  ],
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(1.8);
}
