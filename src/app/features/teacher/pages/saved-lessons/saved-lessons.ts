import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonService } from '../../../../core/services/lesson.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SavedLesson } from '../../../../core/models/lesson.model';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../../shared/ui/icon/icon';
import { exportElementToPdf } from '../../../../shared/utils/pdf-export.util';
import { CleanLessonTextPipe } from '../../../../shared/pipes/clean-lesson-text-pipe';
import {
  extractGeneratedContent,
  parseLessonContent,
  ParsedLessonSection,
} from '../../../../shared/utils/lesson-content.util';

const AVATAR_PALETTE = ['#7c3aed', '#4f46e5', '#2563eb', '#059669', '#d97706', '#0891b2', '#dc2626'];

@Component({
  selector: 'app-saved-lessons',
  imports: [RouterLink, Avatar, EmptyState, Icon, CleanLessonTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-lessons.html',
  styleUrl: './saved-lessons.scss',
})
export class SavedLessons {
  private readonly lessonService = inject(LessonService);
  private readonly toastService = inject(ToastService);
  private readonly injector = inject(Injector);

  readonly lessons = signal<SavedLesson[]>([]);
  readonly lessonsLoading = signal(false);
  readonly lessonsError = signal<string | null>(null);

  readonly expandedLessonId = signal<number | null>(null);
  readonly deleteTarget = signal<SavedLesson | null>(null);
  readonly exportingLessonId = signal<number | null>(null);

  readonly isDeleting = signal(false);
  readonly isExporting = signal(false);

  constructor() {
    this.loadLessons();
  }

  loadLessons(): void {
    this.lessonsLoading.set(true);
    this.lessonsError.set(null);

    this.lessonService.getLessons().subscribe({
      next: (lessons) => {
        this.lessons.set(lessons);
        this.lessonsLoading.set(false);
      },
      error: () => {
        this.lessons.set([]);
        this.lessonsLoading.set(false);
        this.lessonsError.set('Não foi possível carregar as aulas salvas.');
      },
    });
  }

  formatCreatedAt(createdAt: string): string {
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) return createdAt;

    const datePart = parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = parsed.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${datePart}, ${timePart}`;
  }

  initialsFor(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'NA'
    );
  }

  colorForName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
  }

  parseSections(lesson: SavedLesson): ParsedLessonSection[] {
    const raw = extractGeneratedContent(lesson.content);
    if (!raw) return [];
    return parseLessonContent(raw);
  }

  contentFallback(lesson: SavedLesson): string {
    const raw = extractGeneratedContent(lesson.content);
    return raw || 'Conteúdo indisponível.';
  }

  sectionCount(lesson: SavedLesson): number {
    const count = this.parseSections(lesson).length;
    return count > 0 ? count : 1;
  }

  sectionCountLabel(lesson: SavedLesson): string {
    const count = this.sectionCount(lesson);
    return count === 1 ? '1 exercício' : `${count} exercícios`;
  }

  toggleExpand(lessonId: number): void {
    this.expandedLessonId.update((current) => (current === lessonId ? null : lessonId));
  }

  isExpanded(lessonId: number): boolean {
    return this.expandedLessonId() === lessonId;
  }

  openDeleteConfirm(lesson: SavedLesson): void {
    this.deleteTarget.set(lesson);
  }

  closeDeleteConfirm(): void {
    if (this.isDeleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const lesson = this.deleteTarget();
    if (!lesson || this.isDeleting()) return;

    this.isDeleting.set(true);

    this.lessonService.deleteLesson(lesson.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteTarget.set(null);
        if (this.expandedLessonId() === lesson.id) {
          this.expandedLessonId.set(null);
        }
        this.toastService.success('Aula excluída com sucesso.');
        this.loadLessons();
      },
      error: () => {
        this.isDeleting.set(false);
        this.toastService.error('Não foi possível excluir a aula. Tente novamente.');
      },
    });
  }

  async exportToPDF(lesson: SavedLesson): Promise<void> {
    if (this.isExporting()) return;

    const wasExpanded = this.isExpanded(lesson.id);
    if (!wasExpanded) {
      this.expandedLessonId.set(lesson.id);
      await new Promise<void>((resolve) => afterNextRender(() => resolve(), { injector: this.injector }));
    }

    try {
      this.isExporting.set(true);
      this.exportingLessonId.set(lesson.id);
      await new Promise<void>((resolve) => afterNextRender(() => resolve(), { injector: this.injector }));

      const dateStamp = new Date(lesson.createdAt).toISOString().slice(0, 10);
      const safeTopic = lesson.topic.replace(/[^\w\-]+/g, '_').slice(0, 40);
      await exportElementToPdf(`content-to-print-${lesson.id}`, `Aula_${safeTopic}_${dateStamp}.pdf`);
    } catch {
      this.toastService.error('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      this.isExporting.set(false);
      this.exportingLessonId.set(null);
      if (!wasExpanded) {
        this.expandedLessonId.set(null);
      }
    }
  }
}
