import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, defer, delay, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../core/config/api.config';
import { ChangePasswordRequest, RegisterRequest } from '../core/models/auth.model';
import { CreateLiveClassRequest, SaveLessonRequest, UpdateLessonRequest } from '../core/models/lesson.model';
import { CreateStudentRequest } from '../core/models/student.model';
import { SubjectRequest } from '../core/models/subject.model';
import { SaveTaskRequest } from '../core/models/task.model';
import { ApprovalStatus } from '../core/models/teacher.model';
import { AuthService } from '../core/services/auth.service';
import { DemoAiService, DemoHttpResult } from './demo-ai.service';
import { DemoUser } from './demo-fixtures';
import { DemoRequestError, DemoStore } from './demo-store.service';

type DemoSession = Omit<DemoUser, 'password'>;

export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  const scope = classifyDemoUrl(req.url);
  if (scope === 'external' || scope === 'live-backend') {
    return next(req);
  }

  const store = inject(DemoStore);
  const auth = inject(AuthService);
  const ai = inject(DemoAiService);
  const method = req.method.toUpperCase();
  const path = apiPath(req.url);

  return defer(() => {
    const user = store.userFromToken(auth.getToken());
    return runDemoApi(store, ai, user, method, path, req.body);
  }).pipe(
    map((result) => new HttpResponse({ status: result.status, body: result.body })),
    delay(demoLatencyMs()),
    catchError((error: unknown) => throwError(() => toHttpError(error))),
  );
};

export function classifyDemoUrl(url: string): 'external' | 'live-backend' | 'simulated' {
  if (!url.startsWith(API_BASE_URL)) return 'external';
  if (url.startsWith(`${API_BASE_URL}/api/demo/`)) return 'live-backend';
  if (!apiPath(url).startsWith('/api/')) return 'external';
  return 'simulated';
}

export function runDemoApi(
  store: DemoStore,
  ai: DemoAiService,
  user: DemoSession | null,
  method: string,
  path: string,
  body: unknown,
): Observable<DemoHttpResult> {
  return defer(() => {
    const aiResult = ai.tryHandle(user, method, path, body);
    if (aiResult) return aiResult;
    return of(dispatchDemoRequest(store, user, method, path, body));
  });
}

export function dispatchDemoRequest(
  store: DemoStore,
  user: DemoSession | null,
  method: string,
  path: string,
  body: unknown,
): DemoHttpResult {
  if (method === 'POST' && path === '/api/auth/login') {
    const credentials = readLogin(body);
    return ok(store.login(credentials.email, credentials.password));
  }

  if (method === 'POST' && path === '/api/auth/register') {
    return ok(store.register(readRegister(body)));
  }

  if (method === 'POST' && path === '/api/auth/change-password') {
    const session = requireSession(user);
    store.changePassword(session.id, readChangePassword(body));
    return empty();
  }

  if (method === 'GET' && path === '/api/subjects/active') {
    return ok(store.listActiveSubjects());
  }

  if (method === 'GET' && path === '/api/subjects') {
    requireSession(user);
    return ok(store.listSubjects());
  }

  if (method === 'POST' && path === '/api/subjects') {
    requireRole(user, 'ADMIN');
    return ok(store.createSubject(readSubject(body)));
  }

  if (method === 'GET' && path === '/api/teachers') {
    requireRole(user, 'ADMIN');
    return ok(store.listTeachers());
  }

  if (method === 'GET' && path === '/api/teachers/me') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.getTeacherProfile(session.id));
  }

  if (method === 'PUT' && path === '/api/teachers/me/subjects') {
    const session = requireRole(user, 'TEACHER');
    store.setTeacherSubjects(session.id, readSubjectIds(body));
    return empty();
  }

  const review = /^\/api\/teachers\/(\d+)\/review$/.exec(path);
  if (method === 'PATCH' && review) {
    requireRole(user, 'ADMIN');
    return ok(store.reviewTeacher(readId(review[1]), readApprovalStatus(body)));
  }

  if (method === 'GET' && path === '/api/students/progress') {
    const session = requireRole(user, 'STUDENT');
    return ok(store.studentProgress(session.id));
  }

  if (method === 'GET' && path === '/api/students') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.listStudents(session.id));
  }

  if (method === 'POST' && path === '/api/students') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.createStudent(session.id, readCreateStudent(body)));
  }

  if (method === 'GET' && path === '/api/tasks/student') {
    const session = requireRole(user, 'STUDENT');
    return ok(store.listStudentTasks(session.id));
  }

  if (method === 'GET' && path === '/api/tasks') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.listTeacherTasks(session.id));
  }

  if (method === 'POST' && path === '/api/tasks') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.createTask(session.id, readSaveTask(body)));
  }

  const release = /^\/api\/tasks\/(\d+)\/release$/.exec(path);
  if (method === 'PUT' && release) {
    const session = requireRole(user, 'TEACHER');
    return ok(store.releaseTask(session.id, readId(release[1])));
  }

  const submit = /^\/api\/tasks\/(\d+)\/submit$/.exec(path);
  if (method === 'POST' && submit) {
    const session = requireRole(user, 'STUDENT');
    store.submitTask(session.id, readId(submit[1]), readAnswer(body));
    return empty();
  }

  if (method === 'GET' && path === '/api/lessons') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.listLessons(session.id));
  }

  if (method === 'POST' && path === '/api/lessons') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.saveLesson(session.id, readSaveLesson(body)));
  }

  const lesson = /^\/api\/lessons\/(\d+)$/.exec(path);
  if (lesson && method === 'PUT') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.updateLesson(session.id, readId(lesson[1]), readUpdateLesson(body)));
  }

  if (lesson && method === 'DELETE') {
    const session = requireRole(user, 'TEACHER');
    store.deleteLesson(session.id, readId(lesson[1]));
    return empty();
  }

  if (method === 'GET' && path === '/api/live-classes/me') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.listTeacherLiveClasses(session.id));
  }

  if (method === 'GET' && path === '/api/live-classes/student') {
    const session = requireRole(user, 'STUDENT');
    return ok(store.listStudentLiveClasses(session.id));
  }

  if (method === 'POST' && path === '/api/live-classes') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.createLiveClass(session.id, readLiveClass(body)));
  }

  const liveClass = /^\/api\/live-classes\/(\d+)$/.exec(path);
  if (method === 'DELETE' && liveClass) {
    const session = requireRole(user, 'TEACHER');
    store.deleteLiveClass(session.id, readId(liveClass[1]));
    return empty();
  }

  if (method === 'GET' && path === '/api/dashboard/metrics') {
    const session = requireRole(user, 'TEACHER');
    return ok(store.teacherMetrics(session.id));
  }

  if (method === 'GET' && path === '/api/admin/metrics') {
    requireRole(user, 'ADMIN');
    return ok(store.adminMetrics());
  }

  console.warn(`[demo] Rota de API sem simulação: ${method} ${path}`);
  throw new DemoRequestError(404, 'Rota não encontrada.');
}

function ok(body: unknown): DemoHttpResult {
  return { status: 200, body };
}

function empty(): DemoHttpResult {
  return { status: 200, body: null };
}

function demoLatencyMs(): number {
  return 150 + Math.floor(Math.random() * 201);
}

function apiPath(url: string): string {
  return new URL(url).pathname;
}

function toHttpError(error: unknown): HttpErrorResponse {
  if (error instanceof DemoRequestError) {
    return new HttpErrorResponse({
      status: error.status,
      error: { message: error.message },
    });
  }

  console.warn('[demo] Falha inesperada ao simular a API.', error);
  return new HttpErrorResponse({
    status: 500,
    error: { message: 'Não foi possível concluir a operação.' },
  });
}

function requireSession(user: DemoSession | null): DemoSession {
  if (!user) {
    throw new DemoRequestError(401, 'Sessão inválida.');
  }
  return user;
}

function requireRole(user: DemoSession | null, role: DemoSession['role']): DemoSession {
  const session = requireSession(user);
  if (session.role !== role) {
    throw new DemoRequestError(403, 'Você não tem acesso a esta área.');
  }
  return session;
}

function readId(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) {
    throw new DemoRequestError(404, 'Rota não encontrada.');
  }
  return Number(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readLogin(body: unknown): { email: string; password: string } {
  if (!isRecord(body) || typeof body['email'] !== 'string' || typeof body['password'] !== 'string') {
    throw new DemoRequestError(400, 'Informe e-mail e senha.');
  }
  return { email: body['email'], password: body['password'] };
}

function readRegister(body: unknown): RegisterRequest {
  if (
    !isRecord(body) ||
    typeof body['name'] !== 'string' ||
    typeof body['email'] !== 'string' ||
    typeof body['password'] !== 'string' ||
    (body['role'] !== 'ADMIN' && body['role'] !== 'TEACHER' && body['role'] !== 'STUDENT')
  ) {
    throw new DemoRequestError(400, 'Preencha nome, e-mail e senha.');
  }

  const subjectId = body['subjectId'];
  if (subjectId != null && typeof subjectId !== 'number') {
    throw new DemoRequestError(400, 'Selecione uma matéria ativa.');
  }

  return {
    name: body['name'],
    email: body['email'],
    password: body['password'],
    role: body['role'],
    ...(typeof subjectId === 'number' ? { subjectId } : {}),
  };
}

function readChangePassword(body: unknown): ChangePasswordRequest {
  if (!isRecord(body) || typeof body['currentPassword'] !== 'string' || typeof body['newPassword'] !== 'string') {
    throw new DemoRequestError(400, 'Informe a senha atual e a nova senha.');
  }
  return { currentPassword: body['currentPassword'], newPassword: body['newPassword'] };
}

function readSubject(body: unknown): SubjectRequest {
  if (
    !isRecord(body) ||
    typeof body['name'] !== 'string' ||
    typeof body['teachingArea'] !== 'string' ||
    typeof body['color'] !== 'string' ||
    typeof body['icon'] !== 'string'
  ) {
    throw new DemoRequestError(400, 'Preencha nome, área, cor e ícone da matéria.');
  }

  const status = body['status'];
  if (status != null && status !== 'ATIVA' && status !== 'INATIVA') {
    throw new DemoRequestError(400, 'Status de matéria inválido.');
  }

  return {
    name: body['name'],
    teachingArea: body['teachingArea'],
    color: body['color'],
    icon: body['icon'],
    ...(typeof body['description'] === 'string' ? { description: body['description'] } : {}),
    ...(status === 'ATIVA' || status === 'INATIVA' ? { status } : {}),
  };
}

function readSubjectIds(body: unknown): number[] {
  if (!isRecord(body) || !Array.isArray(body['subjectIds'])) {
    throw new DemoRequestError(400, 'Informe as matérias.');
  }

  return body['subjectIds'].map((id) => {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw new DemoRequestError(400, 'Informe as matérias.');
    }
    return id;
  });
}

function readApprovalStatus(body: unknown): ApprovalStatus {
  if (!isRecord(body) || (body['status'] !== 'APROVADO' && body['status'] !== 'REJEITADO' && body['status'] !== 'PENDENTE')) {
    throw new DemoRequestError(400, 'Informe se o professor foi aprovado ou rejeitado.');
  }
  return body['status'];
}

function readCreateStudent(body: unknown): CreateStudentRequest {
  if (!isRecord(body) || typeof body['name'] !== 'string' || typeof body['email'] !== 'string') {
    throw new DemoRequestError(400, 'Informe o nome e o e-mail do aluno.');
  }

  return {
    name: body['name'],
    email: body['email'],
    ...(typeof body['learningLevel'] === 'string' ? { learningLevel: body['learningLevel'] } : {}),
  };
}

function readSaveTask(body: unknown): SaveTaskRequest {
  if (
    !isRecord(body) ||
    typeof body['studentId'] !== 'number' ||
    typeof body['title'] !== 'string' ||
    !isRecord(body['content'])
  ) {
    throw new DemoRequestError(400, 'Não foi possível salvar a tarefa.');
  }

  return {
    studentId: body['studentId'],
    title: body['title'],
    content: body['content'] as unknown as SaveTaskRequest['content'],
  };
}

function readAnswer(body: unknown): string {
  if (!isRecord(body) || typeof body['answer'] !== 'string') {
    throw new DemoRequestError(400, 'Preencha sua resposta antes de enviar.');
  }
  return body['answer'];
}

function readSaveLesson(body: unknown): SaveLessonRequest {
  if (
    !isRecord(body) ||
    typeof body['studentId'] !== 'number' ||
    typeof body['topic'] !== 'string' ||
    !isRecord(body['content']) ||
    typeof body['content']['generatedContent'] !== 'string'
  ) {
    throw new DemoRequestError(400, 'Não foi possível salvar a aula.');
  }

  return {
    studentId: body['studentId'],
    topic: body['topic'],
    content: { generatedContent: body['content']['generatedContent'] },
  };
}

function readUpdateLesson(body: unknown): UpdateLessonRequest {
  if (
    !isRecord(body) ||
    typeof body['topic'] !== 'string' ||
    !isRecord(body['content']) ||
    typeof body['content']['generatedContent'] !== 'string'
  ) {
    throw new DemoRequestError(400, 'Não foi possível atualizar a aula.');
  }

  return {
    topic: body['topic'],
    content: { generatedContent: body['content']['generatedContent'] },
  };
}

function readLiveClass(body: unknown): CreateLiveClassRequest {
  if (
    !isRecord(body) ||
    typeof body['title'] !== 'string' ||
    typeof body['description'] !== 'string' ||
    typeof body['scheduledDateTime'] !== 'string' ||
    !Array.isArray(body['studentIds'])
  ) {
    throw new DemoRequestError(400, 'Preencha título, descrição e data da aula.');
  }

  const studentIds = body['studentIds'].map((id) => {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw new DemoRequestError(400, 'Selecione ao menos um aluno participante.');
    }
    return id;
  });

  return {
    title: body['title'],
    description: body['description'],
    scheduledDateTime: body['scheduledDateTime'],
    studentIds,
  };
}
