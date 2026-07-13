import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { StudentService } from '../../../../core/services/student.service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ProgressBar } from '../../../../shared/ui/progress-bar/progress-bar';

@Component({
  selector: 'app-student-progress',
  imports: [Icon, ProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class Progress implements OnInit {
  private readonly studentService = inject(StudentService);
  readonly progress = this.studentService.progress;

  ngOnInit(): void {
    this.studentService.loadProgress().subscribe();
  }
}
