import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { StudentInsightResponse } from '../models/insight.model';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly http = inject(HttpClient);

  getStudentInsight(studentId: number): Observable<StudentInsightResponse> {
    return this.http.get<StudentInsightResponse>(`${API_BASE_URL}/api/insights/student/${studentId}`);
  }
}
