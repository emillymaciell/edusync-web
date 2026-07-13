import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentService } from '../../../../core/services/student.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { LiveClassService } from '../../../../core/services/live-class.service';
import { DashboardMetrics } from '../../../../core/models/dashboard.model';
import {
  LIVE_CLASS_API_STATUS_LABEL,
  LiveClassApiStatus,
  LiveClassResponse,
} from '../../../../core/models/lesson.model';
import { Student, STUDENT_API_STATUS_LABEL } from '../../../../core/models/student.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, Icon, Avatar, StatusBadge, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly dashboardService = inject(DashboardService);
  private readonly liveClassService = inject(LiveClassService);

  readonly user = this.auth.currentUser;
  readonly statusLabel = STUDENT_API_STATUS_LABEL;
  readonly liveClassStatusLabel = LIVE_CLASS_API_STATUS_LABEL;
  readonly toneForStatus = toneForStatus;

  readonly metrics = signal<DashboardMetrics | null>(null);
  readonly metricsLoading = signal(false);
  readonly metricsError = signal<string | null>(null);

  readonly students = signal<Student[]>([]);
  readonly studentsLoading = signal(false);

  readonly upcomingClasses = signal<LiveClassResponse[]>([]);
  readonly totalUpcomingClasses = signal(0);
  readonly upcomingClassesLoading = signal(false);

  readonly studentsNeedingAttention = computed(() =>
    this.students().filter((s) => s.status === 'ATENCAO' || s.status === 'EM_RISCO')
  );

  constructor() {
    this.loadMetrics();
    this.loadStudents();
    this.loadUpcomingClasses();
  }

  loadMetrics(): void {
    this.metricsLoading.set(true);
    this.metricsError.set(null);

    this.dashboardService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.metricsLoading.set(false);
      },
      error: () => {
        this.metrics.set(null);
        this.metricsLoading.set(false);
        this.metricsError.set('Não foi possível carregar as métricas agora.');
      },
    });
  }

  loadStudents(): void {
    this.studentsLoading.set(true);

    this.studentService.getMyStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.students.set([]);
        this.studentsLoading.set(false);
      },
    });
  }

  loadUpcomingClasses(): void {
    this.upcomingClassesLoading.set(true);

    this.liveClassService.getMyLiveClasses().subscribe({
      next: (response) => {
        const upcoming = Array.isArray(response?.upcoming) ? response.upcoming : [];
        this.totalUpcomingClasses.set(upcoming.length);
        this.upcomingClasses.set(upcoming.slice(0, 3));
        this.upcomingClassesLoading.set(false);
      },
      error: () => {
        this.totalUpcomingClasses.set(0);
        this.upcomingClasses.set([]);
        this.upcomingClassesLoading.set(false);
      },
    });
  }

  liveStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Agendada';
    const key = status.trim().toUpperCase().replace(/\s+/g, '_') as LiveClassApiStatus;
    if (key === 'AGENDADA' || key === 'EM_BREVE' || key === 'FINALIZADA') {
      return this.liveClassStatusLabel[key];
    }
    return status;
  }

  scheduledAt(liveClass: LiveClassResponse): string | null {
    if (liveClass.scheduledDateTime) return liveClass.scheduledDateTime;
    if (liveClass.date && liveClass.time) {
      const date = liveClass.date.includes('/')
        ? liveClass.date.split('/').reverse().join('-')
        : liveClass.date;
      const time = liveClass.time.length === 5 ? `${liveClass.time}:00` : liveClass.time;
      return `${date}T${time}`;
    }
    return liveClass.date ?? null;
  }

  participantCount(liveClass: LiveClassResponse): number {
    return liveClass.participants?.length ?? 0;
  }

  initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase()).join('') || 'NA';
  }

  colorFor(studentId: number): string {
    return AVATAR_PALETTE[studentId % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
  }
}
