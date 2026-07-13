import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TeacherService } from '../services/teacher.service';

export const subjectSelectedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const teacherService = inject(TeacherService);
  const router = inject(Router);

  if (auth.hasTeacherSubject() || teacherService.hasSelectedSubject()) {
    return true;
  }

  return teacherService.applySubjectFromProfile().pipe(
    map((hasSubject) => (hasSubject ? true : router.createUrlTree(['/teacher/onboarding'])))
  );
};

export const onboardingPageGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const teacherService = inject(TeacherService);
  const router = inject(Router);

  if (auth.hasTeacherSubject() || teacherService.hasSelectedSubject()) {
    return router.createUrlTree(['/teacher']);
  }

  return teacherService.applySubjectFromProfile().pipe(
    map((hasSubject) => (hasSubject ? router.createUrlTree(['/teacher']) : true))
  );
};
