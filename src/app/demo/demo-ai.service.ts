import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, map, of, throwError, timeout } from 'rxjs';
import { API_BASE_URL } from '../core/config/api.config';
import { StudentInsightResponse } from '../core/models/insight.model';
import { GeneratedTaskQuestion, GeneratedTaskResponse } from '../core/models/task.model';
import { ToastService } from '../core/services/toast.service';
import { fallbackExercises, fallbackInsight, fallbackLesson } from './demo-ai-fallbacks';
import { DemoAiQuotaService } from './demo-ai-quota.service';
import { DemoUser } from './demo-fixtures';
import { DemoAiStudentContext, DemoRequestError, DemoStore } from './demo-store.service';

// O back-end pode aguardar o Gemini por 30 segundos, além do tempo de rede.
const GENERATION_TIMEOUT_MS = 45000;
const PING_TIMEOUT_MS = 45000;
const REMAINING_HEADER = 'X-Demo-AI-Remaining';

type DemoSession = Omit<DemoUser, 'password'>;

export interface DemoHttpResult {
  status: number;
  body: unknown;
}

@Injectable({ providedIn: 'root' })
export class DemoAiService {
  private readonly store = inject(DemoStore);
  private readonly quota = inject(DemoAiQuotaService);
  private readonly toast = inject(ToastService);
  private readonly http = new HttpClient(inject(HttpBackend));

  warmUp(): void {
    this.http
      .get<unknown>(`${API_BASE_URL}/api/demo/ping`, { observe: 'response' })
      .pipe(timeout(PING_TIMEOUT_MS))
      .subscribe({
        next: (response) => {
          this.quota.applyHeader(response.headers.get(REMAINING_HEADER));
          this.quota.applyPing(response.body);
        },
        error: () => undefined,
      });
  }

  tryHandle(user: DemoSession | null, method: string, path: string, body: unknown): Observable<DemoHttpResult> | null {
    if (method === 'POST' && path === '/api/lessons/generate') {
      return this.generateLesson(user, body);
    }

    if (method === 'POST' && path === '/api/tasks/generate') {
      return this.generateExercises(user, body);
    }

    const cachedInsight = /^\/api\/insights\/student\/(\d+)$/.exec(path);
    if (method === 'GET' && cachedInsight?.[1]) {
      return this.readCachedInsight(user, Number(cachedInsight[1]));
    }

    const refresh = /^\/api\/insights\/(\d+)\/refresh$/.exec(path);
    if (method === 'POST' && refresh?.[1]) {
      return this.refreshInsight(user, Number(refresh[1]));
    }

    if (path.startsWith('/api/insights/')) {
      console.warn(`[demo] Rota de API sem simulação: ${method} ${path}`);
      throw new DemoRequestError(404, 'Rota não encontrada.');
    }

    return null;
  }

  private generateLesson(user: DemoSession | null, body: unknown): Observable<DemoHttpResult> {
    const session = requireTeacher(user);
    const request = readLessonRequest(body);
    const student = this.store.aiStudentContext(session.id, request.studentId);
    const fallback = fallbackLesson(request.topic);

    return this.generate(fallback, () => {
      const payload: Record<string, string> = {
        studentName: student.name,
        learningLevel: student.learningLevel,
        topic: clip(request.topic, 200),
      };
      if (request.observations) {
        payload['observations'] = clip(request.observations, 500);
      }
      return this.post<unknown>('/api/demo/ia/lesson', payload).pipe(
        map((response) => {
          const content = readGeneratedLesson(response);
          if (!content) throw new Error('invalid-lesson');
          return { generatedContent: content };
        }),
      );
    });
  }

  private generateExercises(user: DemoSession | null, body: unknown): Observable<DemoHttpResult> {
    requireTeacher(user);
    const request = readExerciseRequest(body);
    const fallback = fallbackExercises(request.assunto, request.nivelAluno);

    return this.generate(fallback, () =>
      this.post<unknown>('/api/demo/ia/exercises', {
        assunto: clip(request.assunto, 200),
        nivelAluno: clip(request.nivelAluno, 40),
        tipoExercicio: clip(request.tipoExercicio, 40),
      }).pipe(
        map((response) => {
          const exercises = readExercises(response);
          if (!exercises) throw new Error('invalid-exercises');
          return exercises;
        }),
      ),
    );
  }

  private readCachedInsight(user: DemoSession | null, studentId: number): Observable<DemoHttpResult> {
    const session = requireTeacher(user);
    const cached = this.store.cachedInsight(studentId, session.id);
    return of({ status: 200, body: cached });
  }

  private refreshInsight(user: DemoSession | null, studentId: number): Observable<DemoHttpResult> {
    const session = requireTeacher(user);
    const student = this.store.aiStudentContext(session.id, studentId);
    const fallback = withExample(toInsight(student, fallbackInsight(student.name)));

    return this.generate(fallback, () =>
      this.post<unknown>('/api/demo/ia/insight', {
        studentName: student.name,
        recentThemes: student.recentThemes,
        performanceSummary: student.performanceSummary,
      }).pipe(
        map((response) => {
          const parsed = readInsight(response);
          if (!parsed) throw new Error('invalid-insight');
          const insight = toInsight(student, parsed);
          this.store.saveInsight(insight);
          return insight;
        }),
      ),
    );
  }

  private generate(fallback: unknown, request: () => Observable<unknown>): Observable<DemoHttpResult> {
    const blocked = this.blockedReason();
    const source = blocked
      ? of(fallback).pipe(map((body) => {
          this.toast.info(blocked);
          return body;
        }))
      : request().pipe(
          catchError((error: unknown) => {
            if (error instanceof DemoRequestError) return throwError(() => error);
            this.noteFailure(error);
            return of(fallback);
          }),
        );

    return source.pipe(map((body) => ({ status: 200, body })));
  }

  private post<T>(path: string, payload: unknown): Observable<T> {
    return this.http.post<T>(`${API_BASE_URL}${path}`, payload, { observe: 'response' }).pipe(
      timeout(GENERATION_TIMEOUT_MS),
      map((response) => {
        this.quota.applyHeader(response.headers.get(REMAINING_HEADER));
        return response.body as T;
      }),
    );
  }

  private noteFailure(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.quota.applyHeader(error.headers.get(REMAINING_HEADER));
    }
    this.toast.info(fallbackNotice(error));
    this.warmUp();
  }

  private blockedReason(): string | null {
    if (this.quota.aiEnabled() === false) {
      return 'A IA da demonstração está desabilitada. Mostrando uma resposta de exemplo.';
    }
    if (this.quota.remaining() === 0) {
      return 'Limite de gerações atingido. Mostrando uma resposta de exemplo.';
    }
    return null;
  }
}

export function fallbackNotice(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 429) return 'Limite de gerações atingido. Mostrando uma resposta de exemplo.';
    if (error.status === 503) return 'A IA da demonstração está desabilitada. Mostrando uma resposta de exemplo.';
    if (error.status === 502) return 'A IA não concluiu a geração. Mostrando uma resposta de exemplo.';
    if (error.status === 0) return 'Sem resposta da IA. Mostrando uma resposta de exemplo.';
  }
  if (error instanceof TimeoutError || isTimeout(error)) {
    return 'A IA demorou demais. Mostrando uma resposta de exemplo.';
  }
  return 'Mostrando uma resposta de exemplo.';
}

function requireTeacher(user: DemoSession | null): DemoSession {
  if (!user) throw new DemoRequestError(401, 'Sessão inválida.');
  if (user.role !== 'TEACHER') throw new DemoRequestError(403, 'Você não tem acesso a esta área.');
  return user;
}

function readLessonRequest(body: unknown): { studentId: number; topic: string; observations?: string } {
  if (!isRecord(body) || typeof body['studentId'] !== 'number' || typeof body['topic'] !== 'string' || !body['topic'].trim()) {
    throw new DemoRequestError(400, 'Informe o aluno e o tema da aula.');
  }
  const observations = body['observations'];
  return {
    studentId: body['studentId'],
    topic: body['topic'].trim(),
    ...(typeof observations === 'string' && observations.trim() ? { observations: observations.trim() } : {}),
  };
}

function readExerciseRequest(body: unknown): { assunto: string; nivelAluno: string; tipoExercicio: string } {
  if (
    !isRecord(body) ||
    typeof body['assunto'] !== 'string' ||
    !body['assunto'].trim() ||
    typeof body['nivelAluno'] !== 'string' ||
    !body['nivelAluno'].trim() ||
    typeof body['tipoExercicio'] !== 'string' ||
    !body['tipoExercicio'].trim()
  ) {
    throw new DemoRequestError(400, 'Informe assunto, nível e tipo de exercício.');
  }
  return {
    assunto: body['assunto'].trim(),
    nivelAluno: body['nivelAluno'].trim(),
    tipoExercicio: body['tipoExercicio'].trim(),
  };
}

function readGeneratedLesson(body: unknown): string | null {
  if (!isRecord(body) || typeof body['generatedContent'] !== 'string' || !body['generatedContent'].trim()) {
    return null;
  }
  return body['generatedContent'];
}

function readExercises(body: unknown): GeneratedTaskResponse | null {
  if (!isRecord(body) || typeof body['tema'] !== 'string' || !Array.isArray(body['questoes'])) return null;
  const questoes = body['questoes'].map((item) => normalizeQuestion(item)).filter((item): item is GeneratedTaskQuestion => item !== null);
  if (questoes.length === 0 || questoes.length !== body['questoes'].length) return null;
  return {
    tema: body['tema'],
    nivel: typeof body['nivel'] === 'string' ? body['nivel'] : '',
    questoes,
  };
}

function normalizeQuestion(value: unknown): GeneratedTaskQuestion | null {
  if (!isRecord(value) || typeof value['enunciado'] !== 'string' || !Array.isArray(value['opcoes'])) return null;
  const opcoes = value['opcoes'].filter((option): option is string => typeof option === 'string' && option.trim().length > 0);
  if (opcoes.length < 2 || typeof value['respostaCorreta'] !== 'string') return null;
  const expected = value['respostaCorreta'].trim().toLowerCase();
  const respostaCorreta = opcoes.find((option) => option === value['respostaCorreta'])
    ?? opcoes.find((option) => option.trim().toLowerCase() === expected);
  if (!respostaCorreta) return null;
  return {
    enunciado: value['enunciado'],
    opcoes,
    respostaCorreta,
    explicacao: typeof value['explicacao'] === 'string' ? value['explicacao'] : '',
  };
}

function readInsight(body: unknown): { analysis: string; recommendations: string[] } | null {
  if (!isRecord(body) || typeof body['analysis'] !== 'string' || !body['analysis'].trim() || !Array.isArray(body['recommendations'])) {
    return null;
  }
  const recommendations = body['recommendations']
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 4);
  if (recommendations.length === 0) return null;
  return { analysis: body['analysis'].trim(), recommendations };
}

function toInsight(
  student: DemoAiStudentContext,
  content: { analysis: string; recommendations: string[] },
): StudentInsightResponse {
  return {
    studentId: student.studentId,
    module: student.module,
    status: student.statusLabel,
    analysis: content.analysis,
    recommendations: content.recommendations,
    updatedAt: new Date().toISOString(),
  };
}

function withExample(insight: StudentInsightResponse): StudentInsightResponse & { example: true } {
  return { ...insight, example: true };
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isTimeout(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { name?: string }).name === 'TimeoutError';
}

