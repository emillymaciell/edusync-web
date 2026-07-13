import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../../../core/services/teacher.service';
import { StudentService } from '../../../../core/services/student.service';
import { InsightsService } from '../../../../core/services/insights.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StudentInsightResponse } from '../../../../core/models/insight.model';
import { Student, STUDENT_API_STATUS_LABEL } from '../../../../core/models/student.model';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { Icon } from '../../../../shared/ui/icon/icon';

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];

@Component({
  selector: 'app-teacher-insights',
  imports: [Avatar, StatusBadge, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './insights.html',
  styleUrl: './insights.scss',
})
export class Insights {
  private readonly teacherService = inject(TeacherService);
  private readonly studentService = inject(StudentService);
  private readonly insightsService = inject(InsightsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly statusLabel = STUDENT_API_STATUS_LABEL;
  readonly toneForStatus = toneForStatus;

  readonly students = signal<Student[]>([]);
  readonly studentsLoading = signal(false);
  readonly studentsError = signal<string | null>(null);

  private readonly queryStudentId = toSignal(this.route.queryParamMap, { initialValue: null });
  private readonly manualSelection = signal<number | null>(null);

  readonly selectedStudentId = computed<number | null>(() => {
    const manual = this.manualSelection();
    if (manual !== null) return manual;

    const fromQuery = Number(this.queryStudentId()?.get('studentId'));
    if (!Number.isNaN(fromQuery) && fromQuery > 0) return fromQuery;

    return this.students()[0]?.id ?? null;
  });

  readonly selectedStudent = computed(() => this.students().find((s) => s.id === this.selectedStudentId()) ?? null);

  readonly selectedTrilha = computed(() => {
    this.teacherService.students();
    const id = this.selectedStudentId();
    return id ? this.teacherService.trilhaFor(id) : [];
  });

  readonly insight = signal<StudentInsightResponse | null>(null);
  readonly insightLoading = signal(false);
  readonly insightError = signal<string | null>(null);
  readonly refreshLoading = signal(false);

  constructor() {
    this.loadStudents();

    effect(() => {
      this.fetchInsight(this.selectedStudentId());
    });
  }

  select(studentId: number): void {
    this.manualSelection.set(studentId);
  }

  retryInsight(): void {
    this.fetchInsight(this.selectedStudentId());
  }

  refreshAnalysis(): void {
    const studentId = this.selectedStudentId();
    if (studentId === null || this.refreshLoading()) return;

    this.refreshLoading.set(true);
    this.insightError.set(null);

    this.insightsService.refreshStudentInsight(studentId).subscribe({
      next: (response) => {
        this.insight.set(response);
        this.refreshLoading.set(false);
        this.toastService.success('Análise atualizada com sucesso.');
      },
      error: () => {
        this.refreshLoading.set(false);
        this.toastService.error('Não foi possível regenerar a análise de IA.');
      },
    });
  }

  executeRecommendation(recommendation: string): void {
    this.toastService.success('Iniciando ação com base na recomendação da IA...');
    this.router.navigate(['/teacher/fabrica-de-aulas'], {
      state: { recommendation },
    });
  }

  loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentsError.set(null);

    this.studentService.getMyStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.teacherService.syncStudentsCache(students);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.students.set([]);
        this.teacherService.syncStudentsCache([]);
        this.studentsLoading.set(false);
        this.studentsError.set('Não foi possível carregar a lista de alunos.');
      },
    });
  }

  initialsFor(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'NA'
    );
  }

  colorFor(studentId: number): string {
    return AVATAR_PALETTE[studentId % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
  }

  private fetchInsight(studentId: number | null): void {
    if (studentId === null) {
      this.insight.set(null);
      this.insightError.set(null);
      this.refreshLoading.set(false);
      return;
    }

    this.insightLoading.set(true);
    this.insightError.set(null);
    this.refreshLoading.set(false);

    this.insightsService.getStudentInsight(studentId).subscribe({
      next: (response) => {
        this.insight.set(response);
        this.insightLoading.set(false);
      },
      error: () => {
        this.insight.set(null);
        this.insightLoading.set(false);
        this.insightError.set('Não foi possível carregar a análise de IA deste aluno.');
      },
    });
  }
}
