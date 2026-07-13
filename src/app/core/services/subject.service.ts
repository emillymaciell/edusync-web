import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SubjectRequest, SubjectResponse } from '../models/subject.model';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly http = inject(HttpClient);

  getSubjects(): Observable<SubjectResponse[]> {
    return this.http.get<SubjectResponse[]>(`${API_BASE_URL}/api/subjects`);
  }

  getPublicSubjects(): Observable<SubjectResponse[]> {
    return this.http.get<SubjectResponse[]>(`${API_BASE_URL}/api/subjects/active`);
  }

  createSubject(body: SubjectRequest): Observable<SubjectResponse> {
    return this.http.post<SubjectResponse>(`${API_BASE_URL}/api/subjects`, body);
  }
}
