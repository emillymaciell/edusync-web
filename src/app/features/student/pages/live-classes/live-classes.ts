import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  LIVE_CLASS_API_STATUS_LABEL,
  LiveClassApiStatus,
  LiveClassResponse,
} from '../../../../core/models/lesson.model';
import { LiveClassService } from '../../../../core/services/live-class.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-student-live-classes',
  imports: [DatePipe, Icon, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-classes.html',
  styleUrl: './live-classes.scss',
})
export class LiveClasses implements OnInit {
  private readonly liveClassService = inject(LiveClassService);
  private readonly toast = inject(ToastService);

  readonly upcomingClasses = signal<LiveClassResponse[]>([]);
  readonly finishedClasses = signal<LiveClassResponse[]>([]);
  readonly loading = signal(false);

  readonly toneForStatus = toneForStatus;
  readonly statusLabel = LIVE_CLASS_API_STATUS_LABEL;

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading.set(true);

    this.liveClassService.getStudentLiveClasses().subscribe({
      next: (response) => {
        this.upcomingClasses.set(Array.isArray(response?.upcoming) ? response.upcoming : []);
        this.finishedClasses.set(Array.isArray(response?.finished) ? response.finished : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar aulas do aluno:', err);
        this.upcomingClasses.set([]);
        this.finishedClasses.set([]);
        this.loading.set(false);
        this.toast.error('Não foi possível carregar as aulas ao vivo.');
      },
    });
  }

  liveStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Agendada';
    const key = status.trim().toUpperCase().replace(/\s+/g, '_') as LiveClassApiStatus;
    if (key === 'AGENDADA' || key === 'EM_BREVE' || key === 'FINALIZADA') {
      return this.statusLabel[key];
    }
    return status;
  }

  isFinished(status: string | null | undefined): boolean {
    return this.liveStatusLabel(status) === 'Finalizada';
  }

  teacherName(liveClass: LiveClassResponse): string {
    return (
      liveClass.teacherName?.trim() ||
      liveClass.teacher?.name?.trim() ||
      liveClass.teacher?.user?.name?.trim() ||
      'Professor'
    );
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
}
