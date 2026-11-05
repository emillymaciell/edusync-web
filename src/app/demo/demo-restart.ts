import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TeacherService } from '../core/services/teacher.service';
import { DemoAiQuotaService } from './demo-ai-quota.service';
import { DemoStore } from './demo-store.service';

const SESSION_KEYS = ['edusync.session.user', 'edusync.jwt', 'edusync.teacher.subject'] as const;

export function restartDemo(deps: {
  auth: AuthService;
  teacher: TeacherService;
  store: DemoStore;
  quota: DemoAiQuotaService;
  router?: Router;
  refreshQuota?: () => void;
}): void {
  deps.auth.logout();
  deps.teacher.clearSelectedSubject();
  for (const key of SESSION_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // logout já tentou limpar as mesmas chaves.
    }
  }
  deps.store.reset();
  deps.quota.discardStoredCount();
  deps.refreshQuota?.();
  if (deps.router) {
    void deps.router.navigate(['/login']);
  }
}
