import { Routes } from '@angular/router';
import { StudentShell } from './student-shell';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentShell,
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard), title: 'Início · EduSync' },
      { path: 'atividades', loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks), title: 'Minhas Atividades · EduSync' },
      {
        path: 'aulas-ao-vivo',
        loadComponent: () => import('./pages/live-classes/live-classes').then((m) => m.LiveClasses),
        title: 'Aulas ao Vivo · EduSync',
      },
      { path: 'progresso', loadComponent: () => import('./pages/progress/progress').then((m) => m.Progress), title: 'Meu Progresso · EduSync' },
    ],
  },
];
