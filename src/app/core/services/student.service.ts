import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LiveClassListResponse } from '../models/lesson.model';
import { StudentProgressSummary } from '../models/insight.model';
import { CreateStudentRequest, Student } from '../models/student.model';
import { LiveClassService } from './live-class.service';

const EMPTY_PROGRESS: StudentProgressSummary = {
  overallProgress: 0,
  modulesCompleted: 0,
  totalModules: 0,
  lessonsWatched: 0,
  totalLessons: 0,
  tasksSubmitted: 0,
  totalTasks: 0,
  trilha: [],
  achievements: [],
};

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly liveClassService = inject(LiveClassService);

  private readonly _progress = signal<StudentProgressSummary>(EMPTY_PROGRESS);
  readonly progress = this._progress.asReadonly();

  /**
   * Real backend call — used by the TEACHER-side "Insights IA" screen to load the teacher's own
   * student roster (`GET /api/students`).
   */
  getMyStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${API_BASE_URL}/api/students`);
  }

  /** Creates a student account; the backend assigns the default password (`edusync123`). */
  createStudent(data: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(`${API_BASE_URL}/api/students`, data);
  }

  /** Live classes for the logged-in student. */
  getStudentLiveClasses(): Observable<LiveClassListResponse> {
    return this.liveClassService.getStudentLiveClasses();
  }

  /** `GET /api/students/progress` — updates the reactive `progress` signal. */
  loadProgress(): Observable<StudentProgressSummary> {
    return this.http.get<StudentProgressSummary>(`${API_BASE_URL}/api/students/progress`).pipe(
      tap((data) => this._progress.set(this.normalizeProgress(data))),
      catchError((err) => {
        console.error('Erro ao carregar progresso do aluno:', err);
        this._progress.set(EMPTY_PROGRESS);
        return of(EMPTY_PROGRESS);
      }),
    );
  }

  /** Ensures arrays exist so the template never crashes on partial API payloads. */
  private normalizeProgress(data: StudentProgressSummary): StudentProgressSummary {
    return {
      overallProgress: data.overallProgress ?? 0,
      modulesCompleted: data.modulesCompleted ?? 0,
      totalModules: data.totalModules ?? 0,
      lessonsWatched: data.lessonsWatched ?? 0,
      totalLessons: data.totalLessons ?? 0,
      tasksSubmitted: data.tasksSubmitted ?? 0,
      totalTasks: data.totalTasks ?? 0,
      trilha: Array.isArray(data.trilha) ? data.trilha : [],
      achievements: Array.isArray(data.achievements) ? data.achievements : [],
    };
  }
}
