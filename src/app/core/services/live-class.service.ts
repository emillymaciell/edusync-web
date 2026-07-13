import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CreateLiveClassRequest, LiveClassListResponse, LiveClassResponse } from '../models/lesson.model';

@Injectable({ providedIn: 'root' })
export class LiveClassService {
  private readonly http = inject(HttpClient);

  getMyLiveClasses(): Observable<LiveClassListResponse> {
    return this.http.get<LiveClassListResponse>(`${API_BASE_URL}/api/live-classes/me`);
  }

  getStudentLiveClasses(): Observable<LiveClassListResponse> {
    return this.http.get<LiveClassListResponse>(`${API_BASE_URL}/api/live-classes/student`);
  }

  createLiveClass(payload: CreateLiveClassRequest): Observable<LiveClassResponse> {
    return this.http.post<LiveClassResponse>(`${API_BASE_URL}/api/live-classes`, payload);
  }

  cancelLiveClass(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/live-classes/${id}`);
  }
}
