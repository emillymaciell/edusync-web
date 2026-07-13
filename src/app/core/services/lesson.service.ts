import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  LessonResponse,
  SaveLessonRequest,
  SavedLesson,
  UpdateLessonRequest,
} from '../models/lesson.model';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);

  getLessons(): Observable<SavedLesson[]> {
    return this.http.get<SavedLesson[]>(`${API_BASE_URL}/api/lessons`);
  }

  saveLesson(payload: SaveLessonRequest): Observable<LessonResponse> {
    return this.http.post<LessonResponse>(`${API_BASE_URL}/api/lessons`, payload);
  }

  updateLesson(id: number, payload: UpdateLessonRequest): Observable<SavedLesson> {
    return this.http.put<SavedLesson>(`${API_BASE_URL}/api/lessons/${id}`, payload);
  }

  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/lessons/${id}`);
  }
}
