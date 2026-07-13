import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  GenerateTaskRequest,
  GeneratedTaskResponse,
  SaveTaskRequest,
  StudentTaskResponse,
  SubmitStudentTaskRequest,
  TaskResponse,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  getTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${API_BASE_URL}/api/tasks`);
  }

  getStudentTasks(): Observable<StudentTaskResponse[]> {
    return this.http.get<StudentTaskResponse[]>(`${API_BASE_URL}/api/tasks/student`);
  }

  submitTaskAnswer(taskId: number, answer: string): Observable<unknown> {
    const body: SubmitStudentTaskRequest = { answer };
    return this.http.post<unknown>(`${API_BASE_URL}/api/tasks/${taskId}/submit`, body);
  }

  releaseGrade(taskId: number): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${API_BASE_URL}/api/tasks/${taskId}/release`, null);
  }

  saveTask(studentId: number, taskData: { title: string; content: GeneratedTaskResponse }): Observable<TaskResponse> {
    const body: SaveTaskRequest = {
      studentId,
      title: taskData.title,
      content: taskData.content,
    };

    return this.http.post<TaskResponse>(`${API_BASE_URL}/api/tasks`, body);
  }

  generateExercises(request: GenerateTaskRequest): Observable<GeneratedTaskResponse> {
    return this.http.post<GeneratedTaskResponse>(`${API_BASE_URL}/api/tasks/generate`, request);
  }
}
