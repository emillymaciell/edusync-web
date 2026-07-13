import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LIVE_CLASS_API_STATUS_LABEL,
  LiveClass,
  LiveClassApiStatus,
  LiveClassResponse,
} from '../../../../core/models/lesson.model';
import { Student } from '../../../../core/models/student.model';
import { LiveClassService } from '../../../../core/services/live-class.service';
import { StudentService } from '../../../../core/services/student.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Icon } from '../../../../shared/ui/icon/icon';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];

@Component({
  selector: 'app-teacher-live-classes',
  imports: [ReactiveFormsModule, Icon, StatusBadge, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-classes.html',
  styleUrl: './live-classes.scss',
})
export class LiveClasses {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly liveClassService = inject(LiveClassService);
  private readonly studentService = inject(StudentService);

  readonly upcomingClasses = signal<LiveClass[]>([]);
  readonly finishedClasses = signal<LiveClass[]>([]);
  readonly upcoming = this.upcomingClasses;
  readonly finished = this.finishedClasses;
  readonly loading = signal(false);
  readonly isSubmitting = signal(false);

  readonly students = signal<Student[]>([]);
  readonly selectedStudentIds = signal<number[]>([]);

  readonly toneForStatus = toneForStatus;
  readonly showForm = signal(false);
  readonly submitted = signal(false);
  readonly showCancelModal = signal(false);
  readonly classIdToCancel = signal<number | null>(null);
  readonly isCanceling = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
  });

  constructor() {
    this.loadClasses();
    this.loadStudents();
  }

  isStudentSelected(id: number): boolean {
    return this.selectedStudentIds().includes(id);
  }

  toggleStudent(id: number): void {
    this.selectedStudentIds.update((ids) =>
      ids.includes(id) ? ids.filter((studentId) => studentId !== id) : [...ids, id],
    );
  }

  toggleForm(): void {
    if (this.isSubmitting()) return;
    this.showForm.update((open) => !open);
    if (!this.showForm()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.showForm.set(false);
    this.submitted.set(false);
    this.selectedStudentIds.set([]);
    this.form.reset({ title: '', description: '', date: '', time: '' });
  }

  submit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha título, data, horário e descrição para agendar.');
      return;
    }

    if (this.selectedStudentIds().length === 0) {
      this.toast.error('Selecione ao menos um aluno participante.');
      return;
    }

    if (this.isSubmitting()) return;

    const { title, description, date, time } = this.form.getRawValue();
    const scheduledDateTime = `${date}T${time.length === 5 ? `${time}:00` : time}`;

    this.isSubmitting.set(true);

    this.liveClassService
      .createLiveClass({
        title: title.trim(),
        description: description.trim(),
        scheduledDateTime,
        studentIds: this.selectedStudentIds(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadClasses();
          this.toast.success('Aula agendada com sucesso!');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.error('Não foi possível agendar a aula. Tente novamente.');
        },
      });
  }

  openCancelModal(id: string | number): void {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isFinite(numericId)) {
      this.toast.error('Identificador da aula inválido.');
      return;
    }
    this.classIdToCancel.set(numericId);
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    if (this.isCanceling()) return;
    this.showCancelModal.set(false);
    this.classIdToCancel.set(null);
  }

  confirmCancel(): void {
    const id = this.classIdToCancel();
    if (id === null || this.isCanceling()) return;

    this.isCanceling.set(true);

    this.liveClassService.cancelLiveClass(id).subscribe({
      next: () => {
        this.isCanceling.set(false);
        this.showCancelModal.set(false);
        this.classIdToCancel.set(null);
        this.loadClasses();
        this.toast.info('Aula cancelada com sucesso');
      },
      error: (err) => {
        console.error('Erro ao cancelar:', err);
        this.isCanceling.set(false);
        this.showCancelModal.set(false);
        this.classIdToCancel.set(null);
        this.toast.error('Não foi possível cancelar a aula. Tente novamente.');
      },
    });
  }

  loadClasses(): void {
    this.loading.set(true);

    this.liveClassService.getMyLiveClasses().subscribe({
      next: (response) => {
        const upcoming = Array.isArray(response?.upcoming) ? response.upcoming : [];
        const finished = Array.isArray(response?.finished) ? response.finished : [];

        this.upcomingClasses.set(upcoming.map((item) => this.mapToLiveClass(item)));
        this.finishedClasses.set(finished.map((item) => this.mapToLiveClass(item)));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar aulas:', err);
        this.loading.set(false);
        this.upcomingClasses.set([]);
        this.finishedClasses.set([]);
        this.toast.error('Não foi possível carregar as aulas ao vivo.');
      },
    });
  }

  private loadStudents(): void {
    this.studentService.getMyStudents().subscribe({
      next: (students) => this.students.set(students ?? []),
      error: () => this.toast.error('Não foi possível carregar a lista de alunos.'),
    });
  }

  private mapToLiveClass(response: LiveClassResponse): LiveClass {
    const { date, time } = this.resolveDateTime(response);

    return {
      id: String(response.id),
      title: response.title?.trim() || 'Aula ao vivo',
      description: response.description?.trim() || '',
      date,
      time,
      status: this.mapStatus(response.status),
      meetLink: response.meetLink?.trim() || '#',
      participants: (response.participants ?? []).map((participant) => ({
        name: participant.name,
        initials: this.initialsFor(participant.name),
        color: this.colorFor(participant.studentId),
      })),
    };
  }

  private mapStatus(status: string | null | undefined): LiveClass['status'] {
    if (!status) return 'Agendada';

    const key = status.trim().toUpperCase().replace(/\s+/g, '_');
    if (key === 'AGENDADA' || key === 'EM_BREVE' || key === 'FINALIZADA') {
      return LIVE_CLASS_API_STATUS_LABEL[key] as LiveClass['status'];
    }

    const normalized = status.trim().toLowerCase();
    if (normalized === 'agendada') return 'Agendada';
    if (normalized === 'em breve') return 'Em breve';
    if (normalized === 'finalizada') return 'Finalizada';
    return 'Agendada';
  }

  private resolveDateTime(response: LiveClassResponse): { date: string; time: string } {
    if (response.date && response.time) {
      return {
        date: this.formatDisplayDate(response.date),
        time: response.time.slice(0, 5),
      };
    }

    if (response.scheduledDateTime) {
      const parsed = new Date(response.scheduledDateTime);
      if (!Number.isNaN(parsed.getTime())) {
        return {
          date: parsed.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          time: parsed.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        };
      }
    }

    return { date: '—', time: '—' };
  }

  private formatDisplayDate(value: string): string {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (iso) {
      const [, year, month, day] = iso;
      return `${day}/${month}/${year}`;
    }
    return value;
  }

  initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase()).join('') || 'NA';
  }

  colorFor(studentId: number): string {
    return AVATAR_PALETTE[studentId % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
  }
}
