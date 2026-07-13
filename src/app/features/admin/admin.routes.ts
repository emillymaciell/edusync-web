import { Routes } from '@angular/router';
import { AdminShell } from './admin-shell';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard), title: 'Painel Geral · EduSync' },
      { path: 'professores', loadComponent: () => import('./pages/teachers/teachers').then((m) => m.Teachers), title: 'Gestão de Professores · EduSync' },
      { path: 'materias', loadComponent: () => import('./pages/subjects/subjects').then((m) => m.Subjects), title: 'Bases Visuais · EduSync' },
    ],
  },
];
