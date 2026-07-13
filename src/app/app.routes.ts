import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { firstAccessPageGuard } from './core/guards/first-access.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
    title: 'EduSync · A plataforma EdTech que provisiona professores',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Entrar · EduSync',
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
    title: 'Solicitar acesso de professor · EduSync',
  },
  {
    path: 'auth/first-access',
    canActivate: [firstAccessPageGuard],
    loadComponent: () => import('./features/auth/first-access/first-access').then((m) => m.FirstAccess),
    title: 'Atualizar senha · EduSync',
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard('student')],
    loadChildren: () => import('./features/student/student.routes').then((m) => m.STUDENT_ROUTES),
  },
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard('teacher')],
    loadChildren: () => import('./features/teacher/teacher.routes').then((m) => m.TEACHER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
