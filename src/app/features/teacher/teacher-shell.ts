import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { AppShell } from '../../shared/layout/app-shell/app-shell';
import { NavItem } from '../../shared/layout/nav-item.model';
import { AuthService } from '../../core/services/auth.service';
import { TeacherService } from '../../core/services/teacher.service';

const TEACHER_NAV: NavItem[] = [
  { label: 'Visão Geral', icon: 'home', route: '/teacher', exact: true },
  { label: 'Meus Alunos', icon: 'users', route: '/teacher/alunos' },
  { label: 'Fábrica de Aulas', icon: 'sparkles', route: '/teacher/fabrica-de-aulas' },
  { label: 'Aulas Salvas', icon: 'file', route: '/teacher/aulas-salvas' },
  { label: 'Aulas ao Vivo', icon: 'calendar', route: '/teacher/aulas-ao-vivo' },
  { label: 'Tarefas', icon: 'clipboard', route: '/teacher/tarefas' },
  { label: 'Insights IA', icon: 'chart', route: '/teacher/insights' },
];

@Component({
  selector: 'app-teacher-shell',
  imports: [AppShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-shell [navItems]="navItems" [portalLabel]="portalLabel()" />`,
})
export class TeacherShell implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);

  readonly navItems = TEACHER_NAV;
  readonly currentUser = this.auth.currentUser;

  /** Sidebar brand subtitle — always driven by the logged-in teacher's subject. */
  readonly portalLabel = computed(() => {
    const subjectName =
      this.currentUser()?.subjectName?.trim() ||
      this.teacherService.selectedSubject()?.name?.trim() ||
      'Geral';
    return `Professor · ${subjectName}`;
  });

  ngOnInit(): void {
    const cached = this.teacherService.selectedSubject()?.name?.trim();
    if (!this.currentUser()?.subjectName && cached) {
      this.auth.setSubjectName(cached);
    }
    this.teacherService.syncSubjectFromProfile();
  }
}
