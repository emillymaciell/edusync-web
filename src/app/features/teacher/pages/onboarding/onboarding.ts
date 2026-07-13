import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SubjectService } from '../../../../core/services/subject.service';
import { TeacherService } from '../../../../core/services/teacher.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Subject, SubjectStatus, SUBJECT_API_STATUS_LABEL } from '../../../../core/models/subject.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { normalizeSubjectIcon, subjectIconFor } from '../../../../shared/subject-icon.util';

@Component({
  selector: 'app-teacher-onboarding',
  imports: [Icon, Avatar, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding implements OnInit {
  private readonly subjectService = inject(SubjectService);
  private readonly teacherService = inject(TeacherService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly subjects = signal<Subject[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectingId = signal<number | null>(null);
  readonly subjectIconFor = subjectIconFor;

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading.set(true);
    this.error.set(null);

    this.subjectService.getSubjects().subscribe({
      next: (responses) => {
        const subjects = responses
          .filter((item) => item.status === 'ATIVA')
          .map((item) => ({
            id: item.id,
            name: item.name,
            area: item.teachingArea,
            description: item.description,
            color: item.color,
            icon: normalizeSubjectIcon(item.icon),
            status: SUBJECT_API_STATUS_LABEL[item.status] as SubjectStatus,
            teacherCount: item.teacherCount,
          }));
        this.subjects.set(subjects);
        this.loading.set(false);
      },
      error: () => {
        this.subjects.set([]);
        this.loading.set(false);
        this.error.set('Não foi possível carregar as matérias.');
        this.toast.error('Não foi possível carregar as matérias.');
      },
    });
  }

  select(subject: Subject): void {
    if (this.selectingId() !== null) return;

    this.selectingId.set(subject.id);

    this.teacherService.selectSubject(subject).subscribe({
      next: () => {
        this.selectingId.set(null);
        this.router.navigate(['/teacher']);
      },
      error: () => {
        this.selectingId.set(null);
        this.toast.error('Não foi possível salvar sua área de ensino.');
      },
    });
  }
}
