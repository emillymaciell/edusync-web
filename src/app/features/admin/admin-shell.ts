import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from '../../shared/layout/app-shell/app-shell';
import { NavItem } from '../../shared/layout/nav-item.model';

const ADMIN_NAV: NavItem[] = [
  { label: 'Painel Geral', icon: 'home', route: '/admin', exact: true },
  { label: 'Gestão de Professores', icon: 'users', route: '/admin/professores' },
  { label: 'Bases Visuais (Matérias)', icon: 'layers', route: '/admin/materias' },
];

@Component({
  selector: 'app-admin-shell',
  imports: [AppShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-shell [navItems]="navItems" portalLabel="Super Admin" />`,
})
export class AdminShell {
  readonly navItems = ADMIN_NAV;
}
