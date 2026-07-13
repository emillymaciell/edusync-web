import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../../../core/services/student.service';
import { LessonFactoryService } from '../../../../core/services/lesson-factory.service';
import { LessonService } from '../../../../core/services/lesson.service';
import { ToastService } from '../../../../core/services/toast.service';
import { GeneratedLessonResponse } from '../../../../core/models/lesson.model';
import { Student } from '../../../../core/models/student.model';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Icon } from '../../../../shared/ui/icon/icon';

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];

const LEARNING_LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

@Component({
  selector: 'app-lesson-factory',
  imports: [FormsModule, Avatar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-factory.html',
  styleUrl: './lesson-factory.scss',
})
export class LessonFactory {
  private readonly studentService = inject(StudentService);
  private readonly lessonFactoryService = inject(LessonFactoryService);
  private readonly lessonService = inject(LessonService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly students = signal<Student[]>([]);
  readonly studentsLoading = signal(false);
  readonly studentsError = signal<string | null>(null);

  readonly selectedStudentId = signal<number | null>(null);
  readonly topic = signal('');
  readonly notes = signal('');

  readonly isGenerating = signal(false);
  readonly isSaving = signal(false);
  readonly generatedLesson = signal<GeneratedLessonResponse | null>(null);

  constructor() {
    this.applyRecommendationFromNavigation();
    this.loadStudents();
  }

  selectStudent(id: number): void {
    this.selectedStudentId.set(id);
    this.generatedLesson.set(null);
  }

  get canGenerate(): boolean {
    return this.topic().trim().length > 0 && !!this.selectedStudentId() && !this.isGenerating();
  }

  generate(): void {
    const studentId = this.selectedStudentId();
    if (!studentId || !this.canGenerate) return;

    this.isGenerating.set(true);
    this.generatedLesson.set(null);

    const observations = this.notes().trim();

    this.lessonFactoryService.generateLesson(studentId, this.topic().trim(), observations || undefined).subscribe({
      next: (response) => {
        this.generatedLesson.set(response);
        this.isGenerating.set(false);
      },
      error: () => {
        this.isGenerating.set(false);
        this.toastService.error('Não foi possível gerar a aula com IA. Tente novamente.');
      },
    });
  }

  loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentsError.set(null);

    this.studentService.getMyStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        if (this.selectedStudentId() === null && students.length > 0) {
          this.selectedStudentId.set(students[0].id);
        }
        this.studentsLoading.set(false);
      },
      error: () => {
        this.students.set([]);
        this.studentsLoading.set(false);
        this.studentsError.set('Não foi possível carregar a lista de alunos.');
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

  saveLesson(): void {
    const lesson = this.generatedLesson();
    const studentId = this.selectedStudentId();
    const trimmedTopic = this.topic().trim();

    if (!lesson || studentId === null || this.isSaving()) return;

    if (!trimmedTopic) {
      this.toastService.error('Informe o tópico da aula antes de salvar.');
      return;
    }

    this.isSaving.set(true);

    this.lessonService
      .saveLesson({
        studentId,
        topic: trimmedTopic,
        content: lesson,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.generatedLesson.set(null);
          this.toastService.success('Aula salva com sucesso!');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Não foi possível salvar a aula. Tente novamente.');
        },
      });
  }

  private applyRecommendationFromNavigation(): void {
    const fromNavigation = this.router.getCurrentNavigation()?.extras.state?.['recommendation'];
    const fromHistory = history.state?.['recommendation'];
    const fromQuery = this.route.snapshot.queryParamMap.get('recommendation');
    const recommendation = [fromNavigation, fromHistory, fromQuery].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );

    if (recommendation) {
      this.topic.set(recommendation.trim());
    }
  }
}
