import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider, inject, provideAppInitializer } from '@angular/core';
import { authInterceptor } from '../core/interceptors/auth.interceptor';
import { AuthService } from '../core/services/auth.service';
import { TeacherService } from '../core/services/teacher.service';
import { DemoAiQuotaService } from './demo-ai-quota.service';
import { DemoAiService } from './demo-ai.service';
import { DemoBannerHost } from './demo-banner.demo';
import { demoInterceptor } from './demo.interceptor';
import { DemoQuickLogin } from './demo-quick-login.demo';
import { restartDemo } from './demo-restart';
import { DemoStore } from './demo-store.service';

export type { DemoLoginChoice } from './demo-login-choice';
export { DemoBannerHost, DemoQuickLogin };

export const DEMO_ENABLED = true;

export const DEMO_PROVIDERS: ReadonlyArray<Provider | EnvironmentProviders> = [
  provideHttpClient(withInterceptors([demoInterceptor, authInterceptor])),
  provideAppInitializer(() => {
    const ai = inject(DemoAiService);
    restartDemo({
      auth: inject(AuthService),
      teacher: inject(TeacherService),
      store: inject(DemoStore),
      quota: inject(DemoAiQuotaService),
      refreshQuota: () => ai.warmUp(),
    });
  }),
];
