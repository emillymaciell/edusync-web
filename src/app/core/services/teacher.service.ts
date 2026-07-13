import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';
import { Subject as SubjectModel } from '../models/subject.model';
import { TeacherProfileResponse } from '../models/teacher.model';
import {
  CreateStudentRequest,
  Student,
  StudentApiStatus,
  TeacherStudent,
} from '../models/student.model';
import {
  SaveTaskRequest,
  TaskResponse,
  TeacherTask,
  TaskStatus,
} from '../models/task.model';
import {
  CreateLiveClassRequest,
  GenerateLessonRequest,
  GeneratedLessonResponse,
  LiveClass,
  LiveClassListResponse,
  LiveClassResponse,
  LIVE_CLASS_API_STATUS_LABEL,
  LiveClassApiStatus,
} from '../models/lesson.model';
import { TrilhaStep } from '../models/insight.model';
import { normalizeSubjectIcon } from '../../shared/subject-icon.util';

const MODULE_TRACK = ['Fundamentos', 'Present Simple', 'Past Simple', 'Present Perfect', 'Conversação Avançada'];

const SUBJECT_STORAGE_KEY = 'edusync.teacher.subject';

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];

const STUDENT_STATUS_MAP: Record<StudentApiStatus, TeacherStudent['status']> = {
  EM_DIA: 'em-dia',
  ATENCAO: 'atencao',
  EM_RISCO: 'em-risco',
};

const TASK_STATUS_MAP: Record<string, TaskStatus> = {
  PENDENTE: 'pendente',
  ENTREGUE: 'entregue',
  ENVIADA: 'entregue',
  CORRIGIDA: 'corrigida',
  ATRASADA: 'atrasada',
};

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly _selectedSubject = signal<SubjectModel | null>(this.restoreSubject());
  readonly selectedSubject = this._selectedSubject.asReadonly();
  readonly hasSelectedSubject = computed(() => this._selectedSubject() !== null);

  private readonly _students = signal<TeacherStudent[]>([]);
  readonly students = this._students.asReadonly();

  private readonly _tasks = signal<TeacherTask[]>([]);
  readonly tasks = this._tasks.asReadonly();

  private readonly _liveClasses = signal<LiveClass[]>([]);
  readonly liveClasses = this._liveClasses.asReadonly();

  readonly studentsAtRisk = computed(() =>
    this._students().filter((s) => s.status === 'em-risco' || s.status === 'atencao'),
  );
  readonly studentsInGoodShape = computed(() => this._students().filter((s) => s.status === 'em-dia'));

  readonly upcomingLiveClasses = computed(() =>
    this._liveClasses().filter((c) => c.status !== 'Finalizada'),
  );
  readonly finishedLiveClasses = computed(() =>
    this._liveClasses().filter((c) => c.status === 'Finalizada'),
  );

  readonly dashboardStats = computed(() => ({
    activeStudents: this._students().length,
    tasksToGrade: this._tasks().filter((t) => t.status === 'entregue').length,
    upcomingLive: this.upcomingLiveClasses().length,
    lowProgress: this._students().filter((s) => s.progress < 60).length,
    aiAlerts: this.studentsAtRisk().length,
  }));

  private restoreSubject(): SubjectModel | null {
    try {
      const raw = localStorage.getItem(SUBJECT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SubjectModel) : null;
    } catch {
      return null;
    }
  }

  clearSelectedSubject(): void {
    this._selectedSubject.set(null);
    try {
      localStorage.removeItem(SUBJECT_STORAGE_KEY);
    } catch {
    }
  }

  getMyProfile(): Observable<TeacherProfileResponse> {
    return this.http.get<TeacherProfileResponse>(`${API_BASE_URL}/api/teachers/me`).pipe(
      catchError((err) => {
        console.error('Erro ao carregar perfil do professor:', err);
        return throwError(() => err);
      }),
    );
  }

  syncSubjectFromProfile(): void {
    this.applySubjectFromProfile().subscribe();
  }

  applySubjectFromProfile(): Observable<boolean> {
    return this.getMyProfile().pipe(
      map((profile) => {
        const subject = profile.subjects?.[0];
        const subjectName = profile.subjectName?.trim() || subject?.name?.trim();
        if (!subjectName) return false;

        this.auth.setSubjectName(subjectName, subject?.id);

        if (subject) {
          const mapped: SubjectModel = {
            id: subject.id,
            name: subject.name,
            area: subject.teachingArea,
            description: subject.description,
            color: subject.color,
            icon: normalizeSubjectIcon(subject.icon),
            status: subject.status === 'ATIVA' ? 'Ativa' : 'Rascunho',
            teacherCount: subject.teacherCount,
          };
          this._selectedSubject.set(mapped);
          try {
            localStorage.setItem(SUBJECT_STORAGE_KEY, JSON.stringify(mapped));
          } catch {
          }
        }

        return true;
      }),
      catchError((err) => {
        console.error('Erro ao sincronizar matéria do perfil:', err);
        return of(false);
      }),
    );
  }

  selectSubject(subject: SubjectModel): Observable<void> {
    return this.http
      .put<void>(`${API_BASE_URL}/api/teachers/me/subjects`, { subjectIds: [subject.id] })
      .pipe(
        tap(() => {
          this._selectedSubject.set(subject);
          this.auth.setSubjectName(subject.name, subject.id);
          try {
            localStorage.setItem(SUBJECT_STORAGE_KEY, JSON.stringify(subject));
          } catch {
          }
        }),
        catchError((err) => {
          console.error('Erro ao selecionar matéria:', err);
          return throwError(() => err);
        }),
      );
  }

  getStudents(): Observable<TeacherStudent[]> {
    return this.http.get<Student[]>(`${API_BASE_URL}/api/students`).pipe(
      map((list) => (list ?? []).map((s) => this.mapStudent(s))),
      tap((mapped) => this._students.set(mapped)),
      catchError((err) => {
        console.error('Erro ao carregar alunos:', err);
        this._students.set([]);
        return of([]);
      }),
    );
  }

  addStudent(input: CreateStudentRequest): Observable<TeacherStudent> {
    return this.http.post<Student>(`${API_BASE_URL}/api/students`, input).pipe(
      map((created) => this.mapStudent(created)),
      tap((created) => this._students.update((list) => [created, ...list])),
      catchError((err) => {
        console.error('Erro ao cadastrar aluno:', err);
        return throwError(() => err);
      }),
    );
  }

  syncStudentsCache(students: Student[]): void {
    this._students.set(students.map((s) => this.mapStudent(s)));
  }


  getTasks(): Observable<TeacherTask[]> {
    return this.http.get<TaskResponse[]>(`${API_BASE_URL}/api/tasks`).pipe(
      map((list) => (list ?? []).map((t) => this.mapTask(t))),
      tap((mapped) => this._tasks.set(mapped)),
      catchError((err) => {
        console.error('Erro ao carregar tarefas:', err);
        this._tasks.set([]);
        return of([]);
      }),
    );
  }

  addTask(body: SaveTaskRequest): Observable<TeacherTask> {
    return this.http.post<TaskResponse>(`${API_BASE_URL}/api/tasks`, body).pipe(
      map((created) => this.mapTask(created)),
      tap((created) => this._tasks.update((list) => [created, ...list])),
      catchError((err) => {
        console.error('Erro ao criar tarefa:', err);
        return throwError(() => err);
      }),
    );
  }

  setTaskStatus(taskId: string, status: TaskStatus): Observable<TeacherTask | null> {
    const numericId = Number(taskId);
    if (!Number.isFinite(numericId)) {
      return throwError(() => new Error('Identificador de tarefa inválido.'));
    }

    if (status === 'corrigida') {
      return this.http.put<TaskResponse>(`${API_BASE_URL}/api/tasks/${numericId}/release`, null).pipe(
        map((response) => this.mapTask(response)),
        tap((mapped) => {
          this._tasks.update((list) => list.map((t) => (t.id === mapped.id ? mapped : t)));
        }),
        catchError((err) => {
          console.error('Erro ao atualizar status da tarefa:', err);
          return throwError(() => err);
        }),
      );
    }

    this._tasks.update((list) => list.map((t) => (t.id === taskId ? { ...t, status } : t)));
    return of(this._tasks().find((t) => t.id === taskId) ?? null);
  }

  getLiveClasses(): Observable<LiveClass[]> {
    return this.http.get<LiveClassListResponse>(`${API_BASE_URL}/api/live-classes/me`).pipe(
      map((response) => {
        const upcoming = Array.isArray(response?.upcoming) ? response.upcoming : [];
        const finished = Array.isArray(response?.finished) ? response.finished : [];
        return [...upcoming, ...finished].map((item) => this.mapLiveClass(item));
      }),
      tap((mapped) => this._liveClasses.set(mapped)),
      catchError((err) => {
        console.error('Erro ao carregar aulas ao vivo:', err);
        this._liveClasses.set([]);
        return of([]);
      }),
    );
  }

  scheduleLiveClass(payload: CreateLiveClassRequest): Observable<LiveClass> {
    return this.http.post<LiveClassResponse>(`${API_BASE_URL}/api/live-classes`, payload).pipe(
      map((created) => this.mapLiveClass(created)),
      tap((created) => this._liveClasses.update((list) => [created, ...list])),
      catchError((err) => {
        console.error('Erro ao agendar aula ao vivo:', err);
        return throwError(() => err);
      }),
    );
  }

  trilhaFor(studentId: number): TrilhaStep[] {
    const student = this._students().find((s) => s.id === studentId);
    if (!student) return [];
    const currentIndex = MODULE_TRACK.indexOf(student.currentModule);
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;
    return MODULE_TRACK.map((name, index) => ({
      name,
      status: index < activeIndex ? 'concluido' : index === activeIndex ? 'atual' : 'bloqueado',
    }));
  }

  generateLesson(input: {
    studentId: number;
    topic: string;
    notes?: string;
  }): Observable<GeneratedLessonResponse> {
    const body: GenerateLessonRequest = {
      studentId: input.studentId,
      topic: input.topic.trim(),
      ...(input.notes?.trim() ? { observations: input.notes.trim() } : {}),
    };

    return this.http.post<GeneratedLessonResponse>(`${API_BASE_URL}/api/lessons/generate`, body).pipe(
      catchError((err) => {
        console.error('Erro ao gerar aula:', err);
        return throwError(() => err);
      }),
    );
  }

  private mapStudent(student: Student): TeacherStudent {
    const initials =
      student.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'NA';

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      currentModule: this.moduleFromLearningLevel(student.learningLevel),
      status: STUDENT_STATUS_MAP[student.status] ?? 'em-dia',
      progress: this.progressFromLearningLevel(student.learningLevel),
      lastActivity: '—',
      pendingTasks: 0,
      nextClass: '—',
      avatarInitials: initials,
      avatarColor: AVATAR_PALETTE[Math.abs(student.id) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0],
    };
  }

  private moduleFromLearningLevel(learningLevel: string): string {
    const normalized = learningLevel.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized.includes('AVANC')) {
      return MODULE_TRACK[MODULE_TRACK.length - 1]!;
    }
    if (normalized.includes('INTER')) {
      return MODULE_TRACK[2]!; // Past Simple
    }
    return MODULE_TRACK[0]!; // Fundamentos
  }

  private progressFromLearningLevel(learningLevel: string): number {
    const normalized = learningLevel.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized.includes('AVANC')) return 85;
    if (normalized.includes('INTER')) return 55;
    return 25;
  }

  private mapTask(task: TaskResponse): TeacherTask {
    const initials =
      task.studentName
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'AL';

    return {
      id: String(task.id),
      title: task.title,
      description: task.description ?? '',
      module: '—',
      dueDate: this.formatDueDate(task.dueDate),
      status: TASK_STATUS_MAP[task.status] ?? 'pendente',
      assignees: [
        {
          studentId: 0,
          initials,
          color: AVATAR_PALETTE[Math.abs(task.id) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0],
        },
      ],
    };
  }

  private mapLiveClass(response: LiveClassResponse): LiveClass {
    const { date, time } = this.resolveDateTime(response);
    const statusKey = String(response.status ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_') as LiveClassApiStatus;
    const status: LiveClass['status'] =
      statusKey === 'AGENDADA' || statusKey === 'EM_BREVE' || statusKey === 'FINALIZADA'
        ? (LIVE_CLASS_API_STATUS_LABEL[statusKey] as LiveClass['status'])
        : 'Agendada';

    return {
      id: String(response.id),
      title: response.title?.trim() || 'Aula ao vivo',
      description: response.description?.trim() || '',
      date,
      time,
      status,
      meetLink: response.meetLink?.trim() || '#',
      participants: (response.participants ?? []).map((participant, index) => {
        const name = participant.name?.trim() || 'Aluno';
        const seed = participant.studentId ?? index;
        return {
          name,
          initials:
            name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('') || 'AL',
          color: AVATAR_PALETTE[Math.abs(seed) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0],
        };
      }),
    };
  }

  private resolveDateTime(response: LiveClassResponse): { date: string; time: string } {
    if (response.date && response.time) {
      return {
        date: this.formatDisplayDate(response.date),
        time: response.time.slice(0, 5),
      };
    }

    if (response.scheduledDateTime) {
      const parsed = new Date(response.scheduledDateTime);
      if (!Number.isNaN(parsed.getTime())) {
        return {
          date: parsed.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          time: parsed.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        };
      }
    }

    return { date: '—', time: '—' };
  }

  private formatDisplayDate(value: string): string {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (iso) {
      const [, year, month, day] = iso;
      return `${day}/${month}/${year}`;
    }
    return value;
  }

  private formatDueDate(dueDate: string | null): string {
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
