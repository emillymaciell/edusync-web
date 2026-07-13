import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { StudentService } from '../../../../core/services/student.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Student, StudentApiStatus, STUDENT_API_STATUS_LABEL } from '../../../../core/models/student.model';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { Icon } from '../../../../shared/ui/icon/icon';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

type FilterKey = 'todos' | StudentApiStatus;

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];

const LEARNING_LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

@Component({
  selector: 'app-teacher-students',
  imports: [ReactiveFormsModule, Avatar, StatusBadge, Icon, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students {
  private readonly studentService = inject(StudentService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly students = signal<Student[]>([]);
  readonly studentsLoading = signal(false);
  readonly studentsError = signal<string | null>(null);

  readonly statusLabel = STUDENT_API_STATUS_LABEL;
  readonly toneForStatus = toneForStatus;

  readonly search = signal('');
  readonly activeFilter = signal<FilterKey>('todos');

  readonly showAddModal = signal(false);
  readonly addSubmitted = signal(false);
  readonly isAddingStudent = signal(false);

  readonly addStudentForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'EM_DIA', label: 'Em dia' },
    { key: 'ATENCAO', label: 'Atenção' },
    { key: 'EM_RISCO', label: 'Em risco' },
  ];

  constructor() {
    this.loadStudents();
  }

  readonly countFor = (key: FilterKey) =>
    key === 'todos' ? this.students().length : this.students().filter((s) => s.status === key).length;

  readonly filteredStudents = computed(() => {
    const filter = this.activeFilter();
    const query = this.search().trim().toLowerCase();
    return this.students().filter((s) => {
      const matchesFilter = filter === 'todos' || s.status === filter;
      const matchesQuery = !query || s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  });

  loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentsError.set(null);

    this.studentService.getMyStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.students.set([]);
        this.studentsLoading.set(false);
        this.studentsError.set('Não foi possível carregar a lista de alunos agora.');
      },
    });
  }

  initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase()).join('') || 'NA';
  }

  colorFor(studentId: number): string {
    return AVATAR_PALETTE[studentId % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
  }

  learningLevelLabel(level: string): string {
    return LEARNING_LEVEL_LABEL[level] ?? level;
  }

  openInsight(studentId: number): void {
    this.router.navigate(['/teacher/insights'], { queryParams: { studentId } });
  }

  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    if (this.isAddingStudent()) return;
    this.showAddModal.set(false);
    this.addSubmitted.set(false);
    this.addStudentForm.reset({ name: '', email: '' });
  }

  submitAddStudent(): void {
    this.addSubmitted.set(true);
    if (this.addStudentForm.invalid || this.isAddingStudent()) return;

    const { name, email } = this.addStudentForm.getRawValue();
    this.isAddingStudent.set(true);

    this.studentService
      .createStudent({
        name: name.trim(),
        email: email.trim(),
      })
      .subscribe({
        next: (created) => {
          this.students.update((list) => [created, ...list]);
          this.isAddingStudent.set(false);
          this.closeAddModal();
          this.toastService.success(
            `Aluno cadastrado com sucesso! A senha padrão é 'edusync123' e deverá ser alterada no primeiro acesso.`
          );
        },
        error: (err: HttpErrorResponse) => {
          this.isAddingStudent.set(false);
          const message =
            err.status === 409
              ? err.error?.message ?? 'Já existe um aluno com esse e-mail.'
              : err.error?.message ?? 'Não foi possível cadastrar o aluno agora. Tente novamente.';
          this.toastService.error(message);
        },
      });
  }
}
