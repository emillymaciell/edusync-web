import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LiveClassListResponse } from '../models/lesson.model';
import { StudentProgressSummary } from '../models/insight.model';
import { CreateStudentRequest, Student } from '../models/student.model';
import { LiveClassService } from './live-class.service';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly liveClassService = inject(LiveClassService);

  getMyStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${API_BASE_URL}/api/students`);
  }

  createStudent(data: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(`${API_BASE_URL}/api/students`, data);
  }

  getStudentLiveClasses(): Observable<LiveClassListResponse> {
    return this.liveClassService.getStudentLiveClasses();
  }

  private readonly _progress = signal<StudentProgressSummary>({
    overallProgress: 78,
    modulesCompleted: 3,
    totalModules: 5,
    lessonsWatched: 14,
    totalLessons: 18,
    tasksSubmitted: 3,
    totalTasks: 3,
    streakDays: 15,
    trilha: [
      { name: 'Fundamentos', status: 'concluido' },
      { name: 'Present Simple', status: 'concluido' },
      { name: 'Past Simple', status: 'concluido' },
      { name: 'Present Perfect', status: 'atual' },
      { name: 'Conversação Avançada', status: 'bloqueado' },
    ],
    achievements: [
      { title: 'Sequência de 15 dias', description: 'Estudou por 15 dias seguidos', date: '28/06', icon: 'flame' },
      { title: 'Módulo concluído', description: 'Finalizou Past Simple com 92%', date: '20/06', icon: 'trophy' },
    ],
  });
  readonly progress = this._progress.asReadonly();
}
