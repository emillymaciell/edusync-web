import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { GenerateLessonRequest, GeneratedLessonResponse } from '../models/lesson.model';

@Injectable({ providedIn: 'root' })
export class LessonFactoryService {
  private readonly http = inject(HttpClient);

  generateLesson(studentId: number, topic: string, observations?: string): Observable<GeneratedLessonResponse> {
    const body: GenerateLessonRequest = {
      studentId,
      topic,
      ...(observations?.trim() ? { observations: observations.trim() } : {}),
    };

    return this.http.post<GeneratedLessonResponse>(`${API_BASE_URL}/api/lessons/generate`, body);
  }
}
