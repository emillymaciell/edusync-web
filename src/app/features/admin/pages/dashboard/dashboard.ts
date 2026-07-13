import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminDashboardMetrics } from '../../../../core/models/dashboard.model';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { Icon } from '../../../../shared/ui/icon/icon';
import { subjectIconFor } from '../../../../shared/subject-icon.util';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, StatCard, Avatar, StatusBadge, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);

  readonly toneForStatus = toneForStatus;
  readonly subjectIconFor = subjectIconFor;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly metrics = signal<AdminDashboardMetrics | null>(null);

  readonly subjects = this.adminService.subjects;
  readonly pendingTeachers = this.adminService.pendingTeachers;

  readonly stats = computed(() => {
    const metrics = this.metrics();
    if (metrics) return metrics;
    return this.adminService.stats();
  });

  readonly recentTeachers = computed(() => this.adminService.teachers().slice(0, 4));

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    let teachersDone = false;
    let subjectsDone = false;
    let metricsDone = false;
    let hadError = false;

    const finish = (): void => {
      if (!teachersDone || !subjectsDone || !metricsDone) return;
      this.loading.set(false);
      if (hadError) {
        this.error.set('Não foi possível carregar o painel administrativo.');
      }
    };

    this.adminService.fetchTeachers().subscribe({
      next: () => {
        teachersDone = true;
        finish();
      },
      error: () => {
        hadError = true;
        teachersDone = true;
        this.toast.error('Não foi possível carregar os professores.');
        finish();
      },
    });

    this.adminService.fetchSubjects().subscribe({
      next: () => {
        subjectsDone = true;
        finish();
      },
      error: () => {
        hadError = true;
        subjectsDone = true;
        this.toast.error('Não foi possível carregar as matérias.');
        finish();
      },
    });

    this.dashboardService.getAdminMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        metricsDone = true;
        finish();
      },
      error: () => {
        metricsDone = true;
        finish();
      },
    });
  }
}
