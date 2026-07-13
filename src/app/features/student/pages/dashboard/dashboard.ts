import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LIVE_CLASS_API_STATUS_LABEL,
  LiveClassApiStatus,
  LiveClassResponse,
} from '../../../../core/models/lesson.model';
import { StudentTaskResponse, TASK_API_STATUS_LABEL } from '../../../../core/models/task.model';
import { AuthService } from '../../../../core/services/auth.service';
import { LiveClassService } from '../../../../core/services/live-class.service';
import { StudentService } from '../../../../core/services/student.service';
import { TaskService } from '../../../../core/services/task.service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ProgressBar } from '../../../../shared/ui/progress-bar/progress-bar';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink, DatePipe, Icon, ProgressBar, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly taskService = inject(TaskService);
  private readonly liveClassService = inject(LiveClassService);

  readonly user = this.auth.currentUser;
  readonly progress = this.studentService.progress;
  readonly toneForStatus = toneForStatus;
  readonly statusLabel = TASK_API_STATUS_LABEL;

  readonly tasks = signal<StudentTaskResponse[]>([]);
  readonly upcomingClasses = signal<LiveClassResponse[]>([]);

  readonly pendingTasks = computed(() => this.tasks().filter((t) => t.status === 'PENDENTE'));

  readonly nextLiveClass = computed(() => this.upcomingClasses()[0] ?? null);

  ngOnInit(): void {
    this.studentService.loadProgress().subscribe();

    this.taskService.getStudentTasks().subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: () => this.tasks.set([]),
    });

    this.liveClassService.getStudentLiveClasses().subscribe({
      next: (response) => {
        const upcoming = Array.isArray(response?.upcoming) ? response.upcoming : [];
        this.upcomingClasses.set(upcoming);
      },
      error: () => this.upcomingClasses.set([]),
    });
  }

  liveStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Agendada';
    const key = status.trim().toUpperCase().replace(/\s+/g, '_') as LiveClassApiStatus;
    if (key === 'AGENDADA' || key === 'EM_BREVE' || key === 'FINALIZADA') {
      return LIVE_CLASS_API_STATUS_LABEL[key];
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

  formatDueDate(dueDate: string | null): string {
    if (!dueDate) return 'Sem prazo';

    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return dueDate;

    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
