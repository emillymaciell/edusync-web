import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ApiSubjectStatus,
  Subject,
  SubjectRequest,
  SubjectResponse,
  SubjectStatus,
  SUBJECT_API_STATUS_LABEL,
} from '../models/subject.model';
import {
  ApprovalStatus,
  Teacher,
  TeacherProfileResponse,
  TeacherReviewRequest,
  APPROVAL_STATUS_LABEL,
} from '../models/teacher.model';
import { normalizeSubjectIcon } from '../../shared/subject-icon.util';
import { SubjectService } from './subject.service';

const AVATAR_PALETTE = ['#2563eb', '#7c3aed', '#d97706', '#059669', '#db2777', '#0891b2', '#64748b'];

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly subjectService = inject(SubjectService);

  private readonly _subjects = signal<Subject[]>([]);
  private readonly _teachers = signal<Teacher[]>([]);

  readonly subjects = this._subjects.asReadonly();
  readonly teachers = this._teachers.asReadonly();

  readonly activeSubjects = computed(() => this._subjects().filter((s) => s.status === 'Ativa'));
  readonly activeTeachers = computed(() => this._teachers().filter((t) => t.status === 'Ativo'));
  readonly pendingTeachers = computed(() => this._teachers().filter((t) => t.status === 'Pendente'));

  readonly stats = computed(() => ({
    activeTeachers: this.activeTeachers().length,
    pendingTeachers: this.pendingTeachers().length,
    activeSubjects: this.activeSubjects().length,
    totalStudents: 0,
  }));

  fetchTeachers(): Observable<Teacher[]> {
    return this.http.get<TeacherProfileResponse[]>(`${API_BASE_URL}/api/teachers`).pipe(
      map((profiles) => profiles.map((profile) => this.mapTeacher(profile))),
      tap((teachers) => this._teachers.set(teachers))
    );
  }

  fetchSubjects(): Observable<Subject[]> {
    return this.subjectService.getSubjects().pipe(
      map((responses) => responses.map((response) => this.mapSubject(response))),
      tap((subjects) => this._subjects.set(subjects))
    );
  }

  reviewTeacher(teacherProfileId: number, status: ApprovalStatus): Observable<Teacher> {
    const body: TeacherReviewRequest = { status };
    return this.http
      .patch<TeacherProfileResponse>(`${API_BASE_URL}/api/teachers/${teacherProfileId}/review`, body)
      .pipe(
        map((profile) => this.mapTeacher(profile)),
        tap((updated) => {
          this._teachers.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        })
      );
  }

  createSubject(input: {
    name: string;
    area: string;
    description: string;
    color: string;
    icon: string;
    status?: ApiSubjectStatus;
  }): Observable<Subject> {
    const body: SubjectRequest = {
      name: input.name,
      description: input.description || undefined,
      teachingArea: input.area,
      color: input.color,
      icon: input.icon,
      status: input.status ?? 'INATIVA',
    };

    return this.subjectService.createSubject(body).pipe(
      map((response) => this.mapSubject(response)),
      tap((created) => this._subjects.update((list) => [created, ...list]))
    );
  }

  private mapTeacher(profile: TeacherProfileResponse): Teacher {
    const subject = profile.subjects?.[0];
    const subjectName = profile.subjectName?.trim() || subject?.name?.trim() || '';
    const subjectCategory =
      profile.subjectCategory?.trim() || subject?.teachingArea?.trim() || '';
    const initials =
      profile.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'NP';

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      subjectId: subject?.id ?? null,
      subjectName,
      subjectCategory,
      status: APPROVAL_STATUS_LABEL[profile.approvalStatus] === 'Ativo' ? 'Ativo' : 'Pendente',
      avatarInitials: initials,
      avatarColor: AVATAR_PALETTE[profile.id % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0],
    };
  }

  private mapSubject(response: SubjectResponse): Subject {
    return {
      id: response.id,
      name: response.name,
      area: response.teachingArea,
      description: response.description,
      color: response.color,
      icon: normalizeSubjectIcon(response.icon),
      status: SUBJECT_API_STATUS_LABEL[response.status] as SubjectStatus,
      teacherCount: response.teacherCount,
    };
  }
}
