import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from '../../shared/layout/app-shell/app-shell';
import { NavItem } from '../../shared/layout/nav-item.model';

const STUDENT_NAV: NavItem[] = [
  { label: 'Início', icon: 'home', route: '/student', exact: true },
  { label: 'Atividades', icon: 'clipboard', route: '/student/atividades' },
  { label: 'Ao Vivo', icon: 'calendar', route: '/student/aulas-ao-vivo' },
  { label: 'Progresso', icon: 'chart', route: '/student/progresso' },
];

@Component({
  selector: 'app-student-shell',
  imports: [AppShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-shell [navItems]="navItems" portalLabel="Área do Aluno" [useBottomNav]="true" />`,
})
export class StudentShell {
  readonly navItems = STUDENT_NAV;
}
