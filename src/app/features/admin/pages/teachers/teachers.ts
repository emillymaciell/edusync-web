import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { Icon } from '../../../../shared/ui/icon/icon';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-admin-teachers',
  imports: [Avatar, StatusBadge, Icon, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class Teachers implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly teachers = this.adminService.teachers;
  readonly toneForStatus = toneForStatus;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly reviewingId = signal<number | null>(null);
  readonly isSubmitting = signal(false);

  readonly filteredTeachers = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return this.teachers();
    return this.teachers().filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.subjectName.toLowerCase().includes(query) ||
        t.subjectCategory.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.fetchTeachers().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar os professores.');
        this.toast.error('Não foi possível carregar os professores.');
      },
    });
  }

  confirmApproval(teacherId: number): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.reviewingId.set(teacherId);

    this.adminService.reviewTeacher(teacherId, 'APROVADO').subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reviewingId.set(null);
        this.toast.success('Professor aprovado com sucesso.');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.reviewingId.set(null);
        this.toast.error('Não foi possível aprovar o professor.');
      },
    });
  }
}
