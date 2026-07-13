import { Routes } from '@angular/router';
import { TeacherShell } from './teacher-shell';
import { onboardingPageGuard, subjectSelectedGuard } from '../../core/guards/subject-selected.guard';

export const TEACHER_ROUTES: Routes = [
  {
    path: 'onboarding',
    canActivate: [onboardingPageGuard],
    loadComponent: () => import('./pages/onboarding/onboarding').then((m) => m.Onboarding),
    title: 'Escolha sua área · EduSync',
  },
  {
    path: '',
    component: TeacherShell,
    canActivate: [subjectSelectedGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard), title: 'Visão Geral · EduSync' },
      { path: 'alunos', loadComponent: () => import('./pages/students/students').then((m) => m.Students), title: 'Meus Alunos · EduSync' },
      { path: 'insights', loadComponent: () => import('./pages/insights/insights').then((m) => m.Insights), title: 'Insights IA · EduSync' },
      {
        path: 'fabrica-de-aulas',
        loadComponent: () => import('./pages/lesson-factory/lesson-factory').then((m) => m.LessonFactory),
        title: 'Fábrica de Aulas · EduSync',
      },
      {
        path: 'aulas-salvas',
        loadComponent: () => import('./pages/saved-lessons/saved-lessons').then((m) => m.SavedLessons),
        title: 'Aulas Salvas · EduSync',
      },
      {
        path: 'aulas-ao-vivo',
        loadComponent: () => import('./pages/live-classes/live-classes').then((m) => m.LiveClasses),
        title: 'Aulas ao Vivo · EduSync',
      },
      { path: 'tarefas', loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks), title: 'Tarefas · EduSync' },
    ],
  },
];
