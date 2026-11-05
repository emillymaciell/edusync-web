import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TeacherService } from '../core/services/teacher.service';
import { DemoAiQuotaService } from './demo-ai-quota.service';
import { DemoAiService } from './demo-ai.service';
import { restartDemo } from './demo-restart';
import { DemoStore } from './demo-store.service';
import { DemoTourService } from './demo-tour.service';

@Component({
  selector: 'app-demo-banner-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-banner.html',
  styleUrl: './demo-banner.scss',
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:keydown.tab)': 'trapWelcomeFocus($event)',
  },
})
export class DemoBannerHost {
  private readonly auth = inject(AuthService);
  private readonly teacher = inject(TeacherService);
  private readonly store = inject(DemoStore);
  private readonly quota = inject(DemoAiQuotaService);
  private readonly ai = inject(DemoAiService);
  private readonly tour = inject(DemoTourService);
  private readonly router = inject(Router);
  private readonly startButton = viewChild<ElementRef<HTMLButtonElement>>('startButton');
  private readonly welcomeDialog = viewChild<ElementRef<HTMLElement>>('welcomeDialog');

  readonly welcomeOpen = signal(true);
  readonly menuOpen = signal(false);
  readonly remainingLabel = computed(() => {
    const value = this.quota.remaining();
    return value === null ? '—' : String(value);
  });
  readonly aiStatusLabel = computed(() => {
    const enabled = this.quota.aiEnabled();
    if (enabled === false) return 'IA desabilitada';
    if (enabled === true) return 'IA disponível';
    return 'Consultando a disponibilidade da IA';
  });
  readonly limit = this.quota.limit;

  constructor() {
    afterNextRender(() => this.focusStart());
  }

  closeWelcome(): void {
    this.welcomeOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  replayTour(): void {
    this.closeMenu();
    this.tour.replay();
  }

  restart(): void {
    this.closeMenu();
    restartDemo({
      auth: this.auth,
      teacher: this.teacher,
      store: this.store,
      quota: this.quota,
      router: this.router,
      refreshQuota: () => this.ai.warmUp(),
    });
  }

  onEscape(event: Event): void {
    if (this.welcomeOpen()) {
      event.preventDefault();
      this.closeWelcome();
      return;
    }
    if (this.menuOpen()) {
      event.preventDefault();
      this.closeMenu();
    }
  }

  trapWelcomeFocus(event: Event): void {
    if (!this.welcomeOpen() || !(event instanceof KeyboardEvent)) return;
    const dialog = this.welcomeDialog()?.nativeElement;
    if (!dialog) return;

    const focusable = [...dialog.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute('disabled'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusStart(): void {
    this.startButton()?.nativeElement.focus();
  }
}
