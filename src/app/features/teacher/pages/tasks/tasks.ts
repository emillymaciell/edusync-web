import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentService } from '../../../../core/services/student.service';
import { TaskService } from '../../../../core/services/task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Student } from '../../../../core/models/student.model';
import {
  GeneratedTaskQuestion,
  GeneratedTaskResponse,
  TASK_API_STATUS_LABEL,
  TaskApiStatus,
  TaskResponse,
} from '../../../../core/models/task.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { CleanLessonTextPipe } from '../../../../shared/pipes/clean-lesson-text-pipe';

const LEARNING_LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

@Component({
  selector: 'app-teacher-tasks',
  imports: [ReactiveFormsModule, Icon, StatusBadge, CleanLessonTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks {
  private readonly studentService = inject(StudentService);
  private readonly taskService = inject(TaskService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly tasks = signal<TaskResponse[]>([]);
  readonly tasksLoading = signal(false);
  readonly tasksError = signal<string | null>(null);

  readonly toneForStatus = toneForStatus;
  readonly statusLabel = TASK_API_STATUS_LABEL;

  readonly showModal = signal(false);
  readonly students = signal<Student[]>([]);
  readonly studentsLoading = signal(false);
  readonly studentsError = signal<string | null>(null);
  readonly isGenerating = signal(false);
  readonly isSaving = signal(false);
  readonly formSubmitted = signal(false);
  readonly generatedTaskPreview = signal<GeneratedTaskResponse | null>(null);
  readonly previewStudentId = signal<number | null>(null);
  readonly isReleasing = signal(false);

  expandedTaskId: number | null = null;

  readonly form = this.fb.group({
    studentId: [null as number | null, Validators.required],
    assunto: ['', Validators.required],
    nivelAluno: [{ value: '', disabled: true }],
  });

  constructor() {
    this.loadTasks();
    this.loadStudents();
  }

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    if (this.isGenerating()) return;
    this.showModal.set(false);
    this.formSubmitted.set(false);
    this.form.reset({ studentId: null, assunto: '', nivelAluno: '' });
  }

  onStudentChange(): void {
    const studentId = this.form.controls.studentId.value;
    const student = this.students().find((s) => s.id === studentId);
    this.form.controls.nivelAluno.setValue(student ? this.learningLevelLabel(student.learningLevel) : '');
  }

  generateExercises(): void {
    this.formSubmitted.set(true);
    if (this.form.invalid || this.isGenerating()) return;

    const { studentId, assunto } = this.form.getRawValue();
    const student = this.students().find((s) => s.id === studentId);
    const trimmedAssunto = assunto?.trim();
    if (!student || !trimmedAssunto || studentId === null) return;

    this.isGenerating.set(true);

    this.taskService
      .generateExercises({
        assunto: trimmedAssunto,
        nivelAluno: student.learningLevel,
        tipoExercicio: 'MULTIPLA_ESCOLHA',
      })
      .subscribe({
        next: (response) => {
          this.isGenerating.set(false);
          this.previewStudentId.set(studentId);
          this.closeModal();
          this.generatedTaskPreview.set(response);
        },
        error: () => {
          this.isGenerating.set(false);
          this.toastService.error('Não foi possível gerar os exercícios. Tente novamente.');
        },
      });
  }

  loadTasks(): void {
    this.tasksLoading.set(true);
    this.tasksError.set(null);

    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.tasksLoading.set(false);
      },
      error: () => {
        this.tasks.set([]);
        this.tasksLoading.set(false);
        this.tasksError.set('Não foi possível carregar as tarefas.');
      },
    });
  }

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
        this.studentsError.set('Não foi possível carregar a lista de alunos.');
      },
    });
  }

  learningLevelLabel(level: string): string {
    return LEARNING_LEVEL_LABEL[level] ?? level;
  }

  formatDueDate(dueDate: string | null): string {
    if (!dueDate) return 'Sem prazo definido';

    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return dueDate;

    return parsed.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleTask(id: number): void {
    this.expandedTaskId = this.expandedTaskId === id ? null : id;
  }

  parseJson(data: string | Record<string, unknown> | null | undefined): GeneratedTaskResponse | Record<string, string> | null {
    if (data == null) return null;

    if (typeof data === 'object') {
      return data as GeneratedTaskResponse | Record<string, string>;
    }

    if (!data.trim()) return null;

    try {
      return JSON.parse(data) as GeneratedTaskResponse | Record<string, string>;
    } catch {
      return null;
    }
  }

  /** True when the student has submitted (by status or answer payload). */
  hasStudentSubmission(task: TaskResponse): boolean {
    const submittedStatuses: TaskApiStatus[] = ['ENTREGUE', 'ENVIADA', 'CORRIGIDA'];
    if (submittedStatuses.includes(task.status)) return true;

    if (task.studentAnswer == null) return false;
    if (typeof task.studentAnswer === 'object') return true;
    return !!String(task.studentAnswer).trim();
  }

  isQuiz(description: string | null | undefined): boolean {
    const parsed = this.parseJson(description);
    return !!(parsed && 'questoes' in parsed && Array.isArray(parsed.questoes));
  }

  asQuiz(data: string | null | undefined): GeneratedTaskResponse | null {
    const parsed = this.parseJson(data);
    if (parsed && 'questoes' in parsed && Array.isArray(parsed.questoes)) {
      return parsed as GeneratedTaskResponse;
    }
    return null;
  }

  getStudentAnswerForQuestion(studentAnswer: string | null | undefined, questionIndex: number): string {
    const parsed = this.parseJson(studentAnswer);
    if (!parsed) return '';

    // Ignore quiz payload accidentally stored as the answer.
    if ('questoes' in parsed && Array.isArray((parsed as GeneratedTaskResponse).questoes)) {
      return '';
    }

    const answers = parsed as Record<string, string>;
    return answers[String(questionIndex)] ?? answers[questionIndex] ?? '';
  }

  isQuestionCorrect(questao: GeneratedTaskQuestion, studentAnswer: string | null | undefined, questionIndex: number): boolean {
    const selected = this.getStudentAnswerForQuestion(studentAnswer, questionIndex);
    return !!selected && selected === questao.respostaCorreta;
  }

  getOptionClass(
    opcao: string,
    questao: GeneratedTaskQuestion,
    studentAnswer: string | null | undefined,
    questionIndex: number
  ): string {
    const selected = this.getStudentAnswerForQuestion(studentAnswer, questionIndex);
    if (!selected) return '';

    const isCorrect = selected === questao.respostaCorreta;

    if (selected === opcao && isCorrect) return 'correct-selected';
    if (selected === opcao && !isCorrect) return 'wrong-selected';
    if (!isCorrect && opcao === questao.respostaCorreta) return 'correct-answer';
    if (selected === opcao) return 'selected';
    return '';
  }

  releaseCorrection(task: TaskResponse): void {
    if (this.isReleasing()) return;

    this.isReleasing.set(true);

    this.taskService.releaseGrade(task.id).subscribe({
      next: () => {
        this.isReleasing.set(false);
        this.expandedTaskId = null;
        this.toastService.success('Correção liberada ao aluno!');
        this.loadTasks();
      },
      error: () => {
        this.isReleasing.set(false);
        this.toastService.error('Não foi possível liberar a correção. Tente novamente.');
      },
    });
  }

  discardPreview(): void {
    this.generatedTaskPreview.set(null);
    this.previewStudentId.set(null);
  }

  saveTask(): void {
    const preview = this.generatedTaskPreview();
    const studentId = this.previewStudentId();
    if (!preview || studentId === null || this.isSaving()) return;

    this.isSaving.set(true);

    this.taskService
      .saveTask(studentId, {
        title: preview.tema,
        content: preview,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.generatedTaskPreview.set(null);
          this.previewStudentId.set(null);
          this.toastService.success('Tarefa salva com sucesso!');
          this.loadTasks();
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Não foi possível salvar a tarefa. Tente novamente.');
        },
      });
  }
}
