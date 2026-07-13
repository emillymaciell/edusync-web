import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../../core/services/task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { Icon } from '../../../../shared/ui/icon/icon';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { CleanLessonTextPipe } from '../../../../shared/pipes/clean-lesson-text-pipe';
import {
  GeneratedTaskQuestion,
  GeneratedTaskResponse,
  StudentTaskResponse,
  TASK_API_STATUS_LABEL,
} from '../../../../core/models/task.model';

@Component({
  selector: 'app-student-tasks',
  imports: [FormsModule, StatusBadge, Icon, EmptyState, CleanLessonTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly toast = inject(ToastService);

  readonly tasks = signal<StudentTaskResponse[]>([]);
  readonly tasksLoading = signal(false);
  readonly tasksError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly toneForStatus = toneForStatus;
  readonly statusLabel = TASK_API_STATUS_LABEL;

  readonly expandedActivityId = signal<number | null>(null);
  readonly quizAnswers = signal<Record<number, string>>({});
  textAnswer = '';

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.tasksLoading.set(true);
    this.tasksError.set(null);

    this.taskService.getStudentTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.tasksLoading.set(false);
      },
      error: () => {
        this.tasks.set([]);
        this.tasksLoading.set(false);
        this.tasksError.set('Não foi possível carregar as atividades.');
      },
    });
  }

  parseQuiz(description: string): GeneratedTaskResponse | null {
    try {
      const parsed = JSON.parse(description) as GeneratedTaskResponse;
      if (parsed?.questoes && Array.isArray(parsed.questoes)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  isReadonly(task: StudentTaskResponse): boolean {
    return task.status === 'ENTREGUE' || task.status === 'ENVIADA' || task.status === 'CORRIGIDA';
  }

  getStudentAnswerForQuestion(studentAnswer: string | null | undefined, questionIndex: number): string {
    if (studentAnswer == null) return '';

    try {
      const raw = typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer);
      if (!raw.trim()) return '';

      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed[String(questionIndex)] ?? parsed[questionIndex as unknown as string] ?? '';
    } catch {
      return '';
    }
  }

  isOptionSelected(task: StudentTaskResponse, questionIndex: number, opcao: string): boolean {
    if (this.isReadonly(task)) {
      return this.getStudentAnswerForQuestion(task.studentAnswer, questionIndex) === opcao;
    }
    return this.quizAnswers()[questionIndex] === opcao;
  }

  selectOption(questionIndex: number, opcao: string): void {
    this.quizAnswers.update((current) => ({ ...current, [questionIndex]: opcao }));
  }

  isQuestionCorrect(
    questao: GeneratedTaskQuestion,
    studentAnswer: string | null | undefined,
    questionIndex: number
  ): boolean {
    const selected = this.getStudentAnswerForQuestion(studentAnswer, questionIndex);
    return !!selected && selected === questao.respostaCorreta;
  }

  getOptionClass(
    opcao: string,
    questao: GeneratedTaskQuestion,
    task: StudentTaskResponse,
    questionIndex: number
  ): string {
    const selected = this.isReadonly(task)
      ? this.getStudentAnswerForQuestion(task.studentAnswer, questionIndex)
      : this.quizAnswers()[questionIndex] ?? '';

    if (!selected || selected !== opcao) {
      if (
        task.status === 'CORRIGIDA' &&
        selected &&
        selected !== questao.respostaCorreta &&
        opcao === questao.respostaCorreta
      ) {
        return 'correct-answer';
      }
      return '';
    }

    if (task.status === 'CORRIGIDA') {
      return selected === questao.respostaCorreta ? 'correct-selected' : 'wrong-selected';
    }

    // ENTREGUE / ENVIADA — highlight the chosen option without grade colors.
    if (this.isReadonly(task)) return 'selected';
    return '';
  }

  formatDueDate(dueDate: string | null): string {
    if (!dueDate) return 'Sem prazo definido';

    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return dueDate;

    return parsed.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  toggleActivity(task: StudentTaskResponse): void {
    const isClosing = this.expandedActivityId() === task.id;
    this.expandedActivityId.update((current) => (current === task.id ? null : task.id));

    this.quizAnswers.set({});
    this.textAnswer = '';

    if (!isClosing && task.studentAnswer != null) {
      const quiz = this.parseQuiz(task.description);
      if (quiz) {
        try {
          const raw =
            typeof task.studentAnswer === 'string'
              ? task.studentAnswer
              : JSON.stringify(task.studentAnswer);
          const parsed = JSON.parse(raw) as Record<string, string>;
          const normalized: Record<number, string> = {};
          for (const [key, value] of Object.entries(parsed)) {
            const index = Number(key);
            if (Number.isFinite(index) && typeof value === 'string') {
              normalized[index] = value;
            }
          }
          this.quizAnswers.set(normalized);
        } catch {
          this.quizAnswers.set({});
        }
      } else {
        this.textAnswer = String(task.studentAnswer);
      }
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedActivityId() === id;
  }

  submitAnswer(task: StudentTaskResponse): void {
    if (this.isReadonly(task)) return;

    const quiz = this.parseQuiz(task.description);
    const answerToSubmit = quiz ? JSON.stringify(this.quizAnswers()) : this.textAnswer.trim();

    if (!answerToSubmit || answerToSubmit === '{}') {
      this.toast.error('Preencha sua resposta antes de enviar.');
      return;
    }

    this.isSubmitting.set(true);

    this.taskService.submitTaskAnswer(task.id, answerToSubmit).subscribe({
      next: () => {
        this.quizAnswers.set({});
        this.textAnswer = '';
        this.expandedActivityId.set(null);
        this.loadTasks();
        this.isSubmitting.set(false);
        this.toast.success('Resposta enviada com sucesso!');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error('Não foi possível enviar a resposta.');
      },
    });
  }
}
