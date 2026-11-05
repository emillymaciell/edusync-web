import { Injectable, signal } from '@angular/core';
import { AuthResponse, BackendRole, ChangePasswordRequest, RegisterRequest } from '../core/models/auth.model';
import { AdminDashboardMetrics, DashboardMetrics } from '../core/models/dashboard.model';
import { StudentInsightResponse, StudentProgressSummary } from '../core/models/insight.model';
import {
  CreateLiveClassRequest,
  LiveClassListResponse,
  LiveClassResponse,
  SaveLessonRequest,
  SavedLesson,
  UpdateLessonRequest,
} from '../core/models/lesson.model';
import { CreateStudentRequest, STUDENT_API_STATUS_LABEL, Student } from '../core/models/student.model';
import { SubjectRequest, SubjectResponse } from '../core/models/subject.model';
import { GeneratedTaskResponse, SaveTaskRequest, StudentTaskResponse, TaskApiStatus, TaskResponse } from '../core/models/task.model';
import { ApprovalStatus, TeacherProfileResponse } from '../core/models/teacher.model';
import {
  DEMO_DEFAULT_STUDENT_PASSWORD,
  DemoLiveClass,
  DemoProgressProfile,
  DemoState,
  DemoStudent,
  DemoSubject,
  DemoTask,
  DemoTeacher,
  DemoUser,
  LEARNING_LEVEL,
  LearningLevel,
  MODULE_TRACK,
  buildTrilha,
  createDemoState,
} from './demo-fixtures';

const INSIGHT_TTL_MS = 24 * 60 * 60 * 1000;
const SUBMITTED_STATUSES: readonly TaskApiStatus[] = ['ENTREGUE', 'ENVIADA', 'CORRIGIDA'];

export class DemoRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'DemoRequestError';
  }
}

export function buildDemoToken(role: BackendRole, userId: number): string {
  return `demo.${role}.${userId}`;
}

export function parseDemoToken(token: string): { role: BackendRole; userId: number } | null {
  const match = /^demo\.(ADMIN|TEACHER|STUDENT)\.(\d+)$/.exec(token.trim());
  if (!match) return null;

  const role = match[1];
  const userId = Number(match[2]);
  if ((role !== 'ADMIN' && role !== 'TEACHER' && role !== 'STUDENT') || !Number.isInteger(userId)) {
    return null;
  }

  return { role, userId };
}

@Injectable({ providedIn: 'root' })
export class DemoStore {
  private readonly state = signal<DemoState>(structuredClone(createDemoState()));

  reset(): void {
    this.state.set(structuredClone(createDemoState()));
  }

  userFromToken(token: string | null): Omit<DemoUser, 'password'> | null {
    if (!token) return null;
    const parsed = parseDemoToken(token);
    if (!parsed) return null;

    const user = this.state().users.find((item) => item.id === parsed.userId && item.role === parsed.role);
    if (!user) return null;

    const { password: _password, ...safe } = user;
    return safe;
  }

  login(email: string, password: string): AuthResponse {
    const user = this.findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new DemoRequestError(401, 'E-mail ou senha inválidos.');
    }

    if (user.role === 'TEACHER') {
      const teacher = this.teacherByUserId(user.id);
      if (!teacher || teacher.approvalStatus === 'PENDENTE') {
        throw new DemoRequestError(403, 'Seu cadastro está aguardando aprovação.');
      }
      if (teacher.approvalStatus === 'REJEITADO') {
        throw new DemoRequestError(403, 'Seu cadastro não foi aprovado.');
      }
    }

    return this.toAuthResponse(user);
  }

  register(input: RegisterRequest): AuthResponse {
    if (input.role !== 'TEACHER') {
      throw new DemoRequestError(400, 'O cadastro público é exclusivo para professores.');
    }

    const name = input.name?.trim() ?? '';
    const email = input.email?.trim() ?? '';
    const password = input.password ?? '';
    if (!name || !email || !password) {
      throw new DemoRequestError(400, 'Preencha nome, e-mail e senha.');
    }
    if (this.findUserByEmail(email)) {
      throw new DemoRequestError(409, 'Já existe uma conta com esse e-mail.');
    }

    const subject = input.subjectId == null ? undefined : this.findSubject(input.subjectId);
    if (!subject || subject.status !== 'ATIVA') {
      throw new DemoRequestError(400, 'Selecione uma matéria ativa.');
    }

    let userId = 0;
    this.update((draft) => {
      userId = this.takeId(draft, 'user');
      const teacherId = this.takeId(draft, 'teacher');
      draft.users.push({
        id: userId,
        name,
        email,
        password,
        role: 'TEACHER',
        forcePasswordChange: false,
      });
      draft.teachers.push({
        id: teacherId,
        userId,
        approvalStatus: 'PENDENTE',
        bio: null,
        subjectIds: [subject.id],
      });
    });

    const created = this.requireUser(userId);
    return this.toAuthResponse(created);
  }

  changePassword(userId: number, input: ChangePasswordRequest): void {
    const currentPassword = input.currentPassword ?? '';
    const newPassword = input.newPassword ?? '';
    if (!newPassword.trim()) {
      throw new DemoRequestError(400, 'Informe a nova senha.');
    }

    this.update((draft) => {
      const user = draft.users.find((item) => item.id === userId);
      if (!user) {
        throw new DemoRequestError(401, 'Sessão inválida.');
      }
      if (user.password !== currentPassword) {
        throw new DemoRequestError(400, 'Senha atual incorreta.');
      }
      user.password = newPassword;
      user.forcePasswordChange = false;
    });
  }

  listSubjects(): SubjectResponse[] {
    const state = this.state();
    return state.subjects.map((subject) => this.toSubjectResponse(state, subject));
  }

  listActiveSubjects(): SubjectResponse[] {
    return this.listSubjects().filter((subject) => subject.status === 'ATIVA');
  }

  createSubject(input: SubjectRequest): SubjectResponse {
    const name = input.name?.trim() ?? '';
    const teachingArea = input.teachingArea?.trim() ?? '';
    const color = input.color?.trim() ?? '';
    const icon = input.icon?.trim() ?? '';
    if (!name || !teachingArea || !color || !icon) {
      throw new DemoRequestError(400, 'Preencha nome, área, cor e ícone da matéria.');
    }

    let subjectId = 0;
    this.update((draft) => {
      subjectId = this.takeId(draft, 'subject');
      draft.subjects.push({
        id: subjectId,
        name,
        description: input.description?.trim() ?? '',
        teachingArea,
        color,
        icon: icon as DemoSubject['icon'],
        // O formulário do admin sempre envia INATIVA e não há ação de publicar.
        // O cadastro de professor só lista matérias ATIVA.
        status: 'ATIVA',
      });
    });

    const created = this.state().subjects.find((subject) => subject.id === subjectId);
    if (!created) {
      throw new DemoRequestError(500, 'Não foi possível criar a matéria.');
    }
    return this.toSubjectResponse(this.state(), created);
  }

  listTeachers(): TeacherProfileResponse[] {
    const state = this.state();
    return state.teachers.map((teacher) => this.toTeacherProfile(state, teacher));
  }

  reviewTeacher(profileId: number, status: ApprovalStatus): TeacherProfileResponse {
    if (status !== 'APROVADO' && status !== 'REJEITADO') {
      throw new DemoRequestError(400, 'Informe se o professor foi aprovado ou rejeitado.');
    }

    this.update((draft) => {
      const teacher = draft.teachers.find((item) => item.id === profileId);
      if (!teacher) {
        throw new DemoRequestError(404, 'Professor não encontrado.');
      }
      teacher.approvalStatus = status;
    });

    const teacher = this.state().teachers.find((item) => item.id === profileId);
    if (!teacher) {
      throw new DemoRequestError(404, 'Professor não encontrado.');
    }
    return this.toTeacherProfile(this.state(), teacher);
  }

  getTeacherProfile(userId: number): TeacherProfileResponse {
    const teacher = this.requireApprovedTeacher(userId);
    return this.toTeacherProfile(this.state(), teacher);
  }

  setTeacherSubjects(userId: number, subjectIds: number[]): void {
    this.requireApprovedTeacher(userId);
    const uniqueIds = [...new Set(subjectIds)];
    const state = this.state();
    for (const subjectId of uniqueIds) {
      const subject = state.subjects.find((item) => item.id === subjectId);
      if (!subject || subject.status !== 'ATIVA') {
        throw new DemoRequestError(400, 'Selecione uma matéria ativa.');
      }
    }

    this.update((draft) => {
      const teacher = draft.teachers.find((item) => item.userId === userId);
      if (!teacher) {
        throw new DemoRequestError(404, 'Professor não encontrado.');
      }
      teacher.subjectIds = uniqueIds;
    });
  }

  listStudents(teacherUserId: number): Student[] {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const state = this.state();
    return state.students
      .filter((student) => student.teacherId === teacher.id)
      .map((student) => this.toStudent(state, student));
  }

  createStudent(teacherUserId: number, input: CreateStudentRequest): Student {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const name = input.name?.trim() ?? '';
    const email = input.email?.trim() ?? '';
    if (!name || !email) {
      throw new DemoRequestError(400, 'Informe o nome e o e-mail do aluno.');
    }
    if (this.findUserByEmail(email)) {
      throw new DemoRequestError(409, 'Já existe um aluno com esse e-mail.');
    }

    const learningLevel = asLearningLevel(input.learningLevel);
    let studentId = 0;
    this.update((draft) => {
      const userId = this.takeId(draft, 'user');
      studentId = this.takeId(draft, 'student');
      draft.users.push({
        id: userId,
        name,
        email,
        password: DEMO_DEFAULT_STUDENT_PASSWORD,
        role: 'STUDENT',
        forcePasswordChange: true,
      });
      draft.students.push({
        id: studentId,
        userId,
        teacherId: teacher.id,
        learningLevel,
        status: 'EM_DIA',
      });
      draft.progress.push({
        studentId,
        modulesCompleted: 0,
        totalModules: MODULE_TRACK.length,
        lessonsWatched: 0,
        totalLessons: MODULE_TRACK.length * 3,
        trilha: buildTrilha(0),
        achievements: [],
      });
    });

    const created = this.state().students.find((student) => student.id === studentId);
    if (!created) {
      throw new DemoRequestError(500, 'Não foi possível cadastrar o aluno.');
    }
    return this.toStudent(this.state(), created);
  }

  studentProgress(studentUserId: number): StudentProgressSummary {
    const state = this.state();
    const student = state.students.find((item) => item.userId === studentUserId);
    if (!student) {
      throw new DemoRequestError(403, 'Progresso disponível apenas para alunos.');
    }

    const profile = state.progress.find((item) => item.studentId === student.id) ?? emptyProgress(student.id);
    const tasks = state.tasks.filter((task) => task.studentId === student.id);
    return buildProgress(profile, tasks);
  }

  listTeacherTasks(teacherUserId: number): TaskResponse[] {
    this.requireApprovedTeacher(teacherUserId);
    const state = this.state();
    return state.tasks
      .filter((task) => task.teacherUserId === teacherUserId)
      .map((task) => this.toTaskResponse(state, task));
  }

  listStudentTasks(studentUserId: number): StudentTaskResponse[] {
    const state = this.state();
    const student = state.students.find((item) => item.userId === studentUserId);
    if (!student) {
      throw new DemoRequestError(403, 'Tarefas disponíveis apenas para alunos.');
    }

    return state.tasks
      .filter((task) => task.studentId === student.id)
      .map((task) => this.toStudentTask(task));
  }

  createTask(teacherUserId: number, input: SaveTaskRequest): TaskResponse {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const state = this.state();
    const student = state.students.find((item) => item.id === input.studentId && item.teacherId === teacher.id);
    if (!student) {
      throw new DemoRequestError(404, 'Aluno não encontrado.');
    }

    const title = input.title?.trim() || input.content?.tema?.trim() || 'Atividade';
    let taskId = 0;
    this.update((draft) => {
      taskId = this.takeId(draft, 'task');
      draft.tasks.push({
        id: taskId,
        teacherUserId,
        studentId: student.id,
        title,
        description: JSON.stringify(input.content),
        dueDate: null,
        status: 'PENDENTE',
        studentAnswer: null,
        grade: null,
      });
    });

    const created = this.state().tasks.find((task) => task.id === taskId);
    if (!created) {
      throw new DemoRequestError(500, 'Não foi possível salvar a tarefa.');
    }
    return this.toTaskResponse(this.state(), created);
  }

  submitTask(studentUserId: number, taskId: number, answer: string): void {
    const state = this.state();
    const student = state.students.find((item) => item.userId === studentUserId);
    if (!student) {
      throw new DemoRequestError(403, 'Apenas o aluno pode entregar a tarefa.');
    }

    const trimmed = answer?.trim() ?? '';
    if (!trimmed || trimmed === '{}') {
      throw new DemoRequestError(400, 'Preencha sua resposta antes de enviar.');
    }

    this.update((draft) => {
      const task = draft.tasks.find((item) => item.id === taskId && item.studentId === student.id);
      if (!task) {
        throw new DemoRequestError(404, 'Tarefa não encontrada.');
      }
      if (task.status !== 'PENDENTE' && task.status !== 'ATRASADA') {
        throw new DemoRequestError(400, 'Esta tarefa já foi enviada.');
      }
      task.studentAnswer = answer;
      task.status = 'ENTREGUE';
    });
  }

  releaseTask(teacherUserId: number, taskId: number): TaskResponse {
    this.requireApprovedTeacher(teacherUserId);

    this.update((draft) => {
      const task = draft.tasks.find((item) => item.id === taskId && item.teacherUserId === teacherUserId);
      if (!task) {
        throw new DemoRequestError(404, 'Tarefa não encontrada.');
      }
      if (task.status !== 'ENTREGUE') {
        throw new DemoRequestError(400, 'A correção só pode ser liberada depois que o aluno entregar a tarefa.');
      }
      task.grade = gradeQuiz(task.description, task.studentAnswer);
      task.status = 'CORRIGIDA';
    });

    const released = this.state().tasks.find((task) => task.id === taskId);
    if (!released) {
      throw new DemoRequestError(404, 'Tarefa não encontrada.');
    }
    return this.toTaskResponse(this.state(), released);
  }

  listLessons(teacherUserId: number): SavedLesson[] {
    this.requireApprovedTeacher(teacherUserId);
    const state = this.state();
    return state.lessons
      .filter((lesson) => lesson.teacherUserId === teacherUserId)
      .map((lesson) => this.toSavedLesson(state, lesson));
  }

  saveLesson(teacherUserId: number, input: SaveLessonRequest): { id: number } {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const student = this.state().students.find((item) => item.id === input.studentId && item.teacherId === teacher.id);
    if (!student) {
      throw new DemoRequestError(404, 'Aluno não encontrado.');
    }

    const topic = input.topic?.trim() ?? '';
    if (!topic) {
      throw new DemoRequestError(400, 'Informe o tópico da aula.');
    }

    let lessonId = 0;
    this.update((draft) => {
      lessonId = this.takeId(draft, 'lesson');
      draft.lessons.push({
        id: lessonId,
        teacherUserId,
        studentId: student.id,
        topic,
        content: {
          generatedContent: input.content?.generatedContent ?? '',
        },
        createdAt: new Date().toISOString(),
      });
    });

    return { id: lessonId };
  }

  updateLesson(teacherUserId: number, lessonId: number, input: UpdateLessonRequest): SavedLesson {
    this.requireApprovedTeacher(teacherUserId);
    const topic = input.topic?.trim() ?? '';
    if (!topic) {
      throw new DemoRequestError(400, 'Informe o tópico da aula.');
    }

    this.update((draft) => {
      const lesson = draft.lessons.find((item) => item.id === lessonId && item.teacherUserId === teacherUserId);
      if (!lesson) {
        throw new DemoRequestError(404, 'Aula não encontrada.');
      }
      lesson.topic = topic;
      lesson.content = { generatedContent: input.content?.generatedContent ?? '' };
    });

    const updated = this.state().lessons.find((lesson) => lesson.id === lessonId);
    if (!updated) {
      throw new DemoRequestError(404, 'Aula não encontrada.');
    }
    return this.toSavedLesson(this.state(), updated);
  }

  deleteLesson(teacherUserId: number, lessonId: number): void {
    this.requireApprovedTeacher(teacherUserId);
    let removed = false;
    this.update((draft) => {
      const index = draft.lessons.findIndex((item) => item.id === lessonId && item.teacherUserId === teacherUserId);
      if (index === -1) return;
      draft.lessons.splice(index, 1);
      removed = true;
    });
    if (!removed) {
      throw new DemoRequestError(404, 'Aula não encontrada.');
    }
  }

  listTeacherLiveClasses(teacherUserId: number): LiveClassListResponse {
    this.requireApprovedTeacher(teacherUserId);
    return this.partitionLiveClasses(
      this.state().liveClasses.filter((item) => item.teacherUserId === teacherUserId),
    );
  }

  listStudentLiveClasses(studentUserId: number): LiveClassListResponse {
    const student = this.state().students.find((item) => item.userId === studentUserId);
    if (!student) {
      throw new DemoRequestError(403, 'Aulas disponíveis apenas para alunos.');
    }

    return this.partitionLiveClasses(
      this.state().liveClasses.filter((item) => item.studentIds.includes(student.id)),
    );
  }

  createLiveClass(teacherUserId: number, input: CreateLiveClassRequest): LiveClassResponse {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const title = input.title?.trim() ?? '';
    const description = input.description?.trim() ?? '';
    const scheduled = new Date(input.scheduledDateTime);
    if (!title || !description || Number.isNaN(scheduled.getTime())) {
      throw new DemoRequestError(400, 'Preencha título, descrição e data da aula.');
    }
    if (!input.studentIds?.length) {
      throw new DemoRequestError(400, 'Selecione ao menos um aluno participante.');
    }

    const ownedIds = new Set(
      this.state().students.filter((student) => student.teacherId === teacher.id).map((student) => student.id),
    );
    const studentIds = [...new Set(input.studentIds)];
    if (studentIds.some((studentId) => !ownedIds.has(studentId))) {
      throw new DemoRequestError(400, 'Selecione apenas alunos da sua turma.');
    }

    const when = scheduleParts(scheduled);
    let classId = 0;
    this.update((draft) => {
      classId = this.takeId(draft, 'liveClass');
      draft.liveClasses.push({
        id: classId,
        teacherUserId,
        title,
        description,
        scheduledDateTime: when.scheduledDateTime,
        date: when.date,
        time: when.time,
        status: scheduled.getTime() < Date.now() ? 'FINALIZADA' : 'AGENDADA',
        meetLink: 'https://meet.google.com/edusync-demo-nova',
        studentIds,
      });
    });

    const created = this.state().liveClasses.find((item) => item.id === classId);
    if (!created) {
      throw new DemoRequestError(500, 'Não foi possível agendar a aula.');
    }
    return this.toLiveClass(this.state(), created);
  }

  deleteLiveClass(teacherUserId: number, classId: number): void {
    this.requireApprovedTeacher(teacherUserId);
    let removed = false;
    this.update((draft) => {
      const index = draft.liveClasses.findIndex((item) => item.id === classId && item.teacherUserId === teacherUserId);
      if (index === -1) return;
      draft.liveClasses.splice(index, 1);
      removed = true;
    });
    if (!removed) {
      throw new DemoRequestError(404, 'Aula não encontrada.');
    }
  }

  teacherMetrics(teacherUserId: number): DashboardMetrics {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const state = this.state();
    const students = state.students.filter((student) => student.teacherId === teacher.id);
    const tasks = state.tasks.filter((task) => task.teacherUserId === teacherUserId);
    const upcoming = state.liveClasses.filter(
      (item) => item.teacherUserId === teacherUserId && item.status !== 'FINALIZADA',
    );

    return {
      activeStudents: students.length,
      tasksToCorrect: tasks.filter((task) => task.status === 'ENTREGUE' || task.status === 'ENVIADA').length,
      upcomingClasses: upcoming.length,
      aiAlerts: students.filter((student) => student.status === 'EM_RISCO' || student.status === 'ATENCAO').length,
    };
  }

  adminMetrics(): AdminDashboardMetrics {
    const state = this.state();
    return {
      activeTeachers: state.teachers.filter((teacher) => teacher.approvalStatus === 'APROVADO').length,
      pendingTeachers: state.teachers.filter((teacher) => teacher.approvalStatus === 'PENDENTE').length,
      activeSubjects: state.subjects.filter((subject) => subject.status === 'ATIVA').length,
      totalStudents: state.students.length,
    };
  }

  aiStudentContext(teacherUserId: number, studentId: number): DemoAiStudentContext {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const state = this.state();
    const student = state.students.find((item) => item.id === studentId && item.teacherId === teacher.id);
    if (!student) {
      throw new DemoRequestError(404, 'Aluno não encontrado.');
    }

    const user = state.users.find((item) => item.id === student.userId);
    const tasks = state.tasks.filter((task) => task.studentId === student.id);
    const recentTitles = [...tasks]
      .sort((left, right) => right.id - left.id)
      .map((task) => task.title.trim())
      .filter((title) => title.length > 0);
    const grades = tasks.map((task) => task.grade).filter((grade): grade is number => typeof grade === 'number');
    const average = grades.length === 0 ? null : Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
    const pending = tasks.filter((task) => task.status === 'PENDENTE').length;
    const overdue = tasks.filter((task) => task.status === 'ATRASADA').length;
    const currentModule = state.progress
      .find((profile) => profile.studentId === student.id)
      ?.trilha.find((step) => step.status === 'atual')?.name;

    return {
      studentId: student.id,
      name: clipText(user?.name?.trim() || 'Aluno', 80),
      learningLevel: clipText(student.learningLevel.trim() || 'INICIANTE', 30),
      statusLabel: STUDENT_API_STATUS_LABEL[student.status],
      module: currentModule?.trim() || 'N/A',
      recentThemes: clipText(recentTitles.join('; ') || 'sem tarefas recentes registradas', 500),
      performanceSummary: clipText(
        `${average === null ? 'sem média' : `média ${average}`}, ${pending} ${pending === 1 ? 'pendente' : 'pendentes'}, ${overdue} ${overdue === 1 ? 'atrasada' : 'atrasadas'}`,
        800,
      ),
    };
  }

  cachedInsight(studentId: number, teacherUserId: number): StudentInsightResponse | null {
    const teacher = this.requireApprovedTeacher(teacherUserId);
    const student = this.state().students.find((item) => item.id === studentId && item.teacherId === teacher.id);
    if (!student) {
      throw new DemoRequestError(404, 'Aluno não encontrado.');
    }

    const insight = this.state().insights.find((item) => item.studentId === studentId);
    if (!insight) return null;

    const updatedAt = Date.parse(insight.updatedAt);
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > INSIGHT_TTL_MS) {
      return null;
    }

    return clone(insight);
  }

  saveInsight(insight: StudentInsightResponse): void {
    this.update((draft) => {
      const index = draft.insights.findIndex((item) => item.studentId === insight.studentId);
      const copy = clone(insight);
      if (index === -1) {
        draft.insights.push(copy);
      } else {
        draft.insights[index] = copy;
      }
    });
  }

  private update(mutator: (draft: DemoState) => void): void {
    const draft = structuredClone(this.state());
    mutator(draft);
    this.state.set(draft);
  }

  private takeId(draft: DemoState, key: keyof DemoState['sequences']): number {
    draft.sequences[key] += 1;
    return draft.sequences[key];
  }

  private requireUser(userId: number): DemoUser {
    const user = this.state().users.find((item) => item.id === userId);
    if (!user) {
      throw new DemoRequestError(401, 'Sessão inválida.');
    }
    return user;
  }

  private requireApprovedTeacher(userId: number): DemoTeacher {
    const teacher = this.teacherByUserId(userId);
    if (!teacher || teacher.approvalStatus !== 'APROVADO') {
      throw new DemoRequestError(403, 'Seu cadastro está aguardando aprovação.');
    }
    return teacher;
  }

  private teacherByUserId(userId: number): DemoTeacher | undefined {
    return this.state().teachers.find((teacher) => teacher.userId === userId);
  }

  private findUserByEmail(email: string): DemoUser | undefined {
    const normalized = email.trim().toLowerCase();
    return this.state().users.find((user) => user.email.toLowerCase() === normalized);
  }

  private findSubject(subjectId: number): DemoSubject | undefined {
    return this.state().subjects.find((subject) => subject.id === subjectId);
  }

  private toAuthResponse(user: DemoUser): AuthResponse {
    const teacher = user.role === 'TEACHER' ? this.teacherByUserId(user.id) : undefined;
    const subject = teacher ? this.primarySubject(this.state(), teacher) : undefined;

    return {
      token: buildDemoToken(user.role, user.id),
      tokenType: 'Bearer',
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange,
      ...(subject ? { subjectName: subject.name, subjectId: subject.id } : {}),
    };
  }

  private toSubjectResponse(state: DemoState, subject: DemoSubject): SubjectResponse {
    const teacherCount = state.teachers.filter(
      (teacher) => teacher.approvalStatus === 'APROVADO' && teacher.subjectIds.includes(subject.id),
    ).length;

    return {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      teachingArea: subject.teachingArea,
      color: subject.color,
      icon: subject.icon,
      status: subject.status,
      teacherCount,
    };
  }

  private toTeacherProfile(state: DemoState, teacher: DemoTeacher): TeacherProfileResponse {
    const user = state.users.find((item) => item.id === teacher.userId);
    const subjects = teacher.subjectIds
      .map((subjectId) => state.subjects.find((subject) => subject.id === subjectId))
      .filter((subject): subject is DemoSubject => subject != null)
      .map((subject) => this.toSubjectResponse(state, subject));
    const primary = subjects[0];

    return {
      id: teacher.id,
      userId: teacher.userId,
      name: user?.name ?? '',
      email: user?.email ?? '',
      approvalStatus: teacher.approvalStatus,
      bio: teacher.bio,
      subjects,
      subjectName: primary?.name ?? null,
      subjectCategory: primary?.teachingArea ?? null,
    };
  }

  private primarySubject(state: DemoState, teacher: DemoTeacher): DemoSubject | undefined {
    const subjectId = teacher.subjectIds[0];
    if (subjectId == null) return undefined;
    return state.subjects.find((subject) => subject.id === subjectId);
  }

  private toStudent(state: DemoState, student: DemoStudent): Student {
    const user = state.users.find((item) => item.id === student.userId);
    return {
      id: student.id,
      userId: student.userId,
      name: user?.name ?? '',
      email: user?.email ?? '',
      teacherId: student.teacherId,
      learningLevel: student.learningLevel,
      status: student.status,
    };
  }

  private toTaskResponse(state: DemoState, task: DemoTask): TaskResponse {
    const student = state.students.find((item) => item.id === task.studentId);
    const user = student ? state.users.find((item) => item.id === student.userId) : undefined;
    return {
      id: task.id,
      title: task.title,
      studentName: user?.name ?? 'Aluno',
      dueDate: task.dueDate,
      status: task.status,
      description: task.description,
      studentAnswer: task.studentAnswer,
    };
  }

  private toStudentTask(task: DemoTask): StudentTaskResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      studentAnswer: task.studentAnswer,
    };
  }

  private toSavedLesson(state: DemoState, lesson: DemoState['lessons'][number]): SavedLesson {
    const student = state.students.find((item) => item.id === lesson.studentId);
    const user = student ? state.users.find((item) => item.id === student.userId) : undefined;
    return {
      id: lesson.id,
      topic: lesson.topic,
      studentId: lesson.studentId,
      studentName: user?.name ?? 'Aluno',
      createdAt: lesson.createdAt,
      content: clone(lesson.content),
    };
  }

  private partitionLiveClasses(classes: DemoLiveClass[]): LiveClassListResponse {
    const state = this.state();
    const byDate = (left: DemoLiveClass, right: DemoLiveClass) =>
      left.scheduledDateTime.localeCompare(right.scheduledDateTime);

    return {
      upcoming: classes
        .filter((item) => item.status !== 'FINALIZADA')
        .sort(byDate)
        .map((item) => this.toLiveClass(state, item)),
      finished: classes
        .filter((item) => item.status === 'FINALIZADA')
        .sort((left, right) => right.scheduledDateTime.localeCompare(left.scheduledDateTime))
        .map((item) => this.toLiveClass(state, item)),
    };
  }

  private toLiveClass(state: DemoState, liveClass: DemoLiveClass): LiveClassResponse {
    const teacher = state.teachers.find((item) => item.userId === liveClass.teacherUserId);
    const teacherUser = teacher ? state.users.find((item) => item.id === teacher.userId) : undefined;

    return {
      id: liveClass.id,
      title: liveClass.title,
      description: liveClass.description,
      date: liveClass.date,
      time: liveClass.time,
      scheduledDateTime: liveClass.scheduledDateTime,
      status: liveClass.status,
      meetLink: liveClass.meetLink,
      teacherName: teacherUser?.name ?? null,
      participants: liveClass.studentIds.map((studentId) => {
        const student = state.students.find((item) => item.id === studentId);
        const user = student ? state.users.find((item) => item.id === student.userId) : undefined;
        return { studentId, name: user?.name ?? 'Aluno' };
      }),
    };
  }
}

function buildProgress(profile: DemoProgressProfile, tasks: DemoTask[]): StudentProgressSummary {
  const totalTasks = tasks.length;
  const tasksSubmitted = tasks.filter((task) => SUBMITTED_STATUSES.includes(task.status)).length;
  const corrected = tasks.filter((task) => task.status === 'CORRIGIDA').length;
  const moduleRatio = profile.totalModules > 0 ? profile.modulesCompleted / profile.totalModules : 0;
  const submittedRatio = totalTasks > 0 ? tasksSubmitted / totalTasks : 0;
  const correctedRatio = totalTasks > 0 ? corrected / totalTasks : 0;
  const overallProgress = Math.round((moduleRatio * 0.6 + submittedRatio * 0.2 + correctedRatio * 0.2) * 100);

  return {
    overallProgress,
    modulesCompleted: profile.modulesCompleted,
    totalModules: profile.totalModules,
    lessonsWatched: profile.lessonsWatched,
    totalLessons: profile.totalLessons,
    tasksSubmitted,
    totalTasks,
    trilha: profile.trilha.map((step) => ({ ...step })),
    achievements: profile.achievements.map((achievement) => ({ ...achievement })),
  };
}

function emptyProgress(studentId: number): DemoProgressProfile {
  return {
    studentId,
    modulesCompleted: 0,
    totalModules: MODULE_TRACK.length,
    lessonsWatched: 0,
    totalLessons: 0,
    trilha: buildTrilha(0),
    achievements: [],
  };
}

function gradeQuiz(description: string, studentAnswer: string | null): number | null {
  let quiz: GeneratedTaskResponse;
  try {
    quiz = JSON.parse(description) as GeneratedTaskResponse;
  } catch {
    return null;
  }

  if (!quiz?.questoes || !Array.isArray(quiz.questoes)) {
    return null;
  }

  const total = quiz.questoes.length;
  if (total === 0) return null;

  const answers = parseAnswerMap(studentAnswer);
  let correct = 0;
  quiz.questoes.forEach((question, index) => {
    const selected = answers[String(index)];
    const expected = question.respostaCorreta;
    if (typeof selected !== 'string' || typeof expected !== 'string') return;
    if (selected.trim().toLowerCase() === expected.trim().toLowerCase()) {
      correct += 1;
    }
  });

  return Math.round((correct * 10) / total);
}

function parseAnswerMap(studentAnswer: string | null): Record<string, string> {
  if (!studentAnswer) return {};

  try {
    const parsed = JSON.parse(studentAnswer) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || 'questoes' in parsed) {
      return {};
    }

    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        answers[key] = value;
      }
    }
    return answers;
  } catch {
    return {};
  }
}

function asLearningLevel(value: string | undefined): LearningLevel {
  if (value === LEARNING_LEVEL.INICIANTE || value === LEARNING_LEVEL.INTERMEDIARIO || value === LEARNING_LEVEL.AVANCADO) {
    return value;
  }
  return LEARNING_LEVEL.INICIANTE;
}

function scheduleParts(date: Date): { scheduledDateTime: string; date: string; time: string } {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return {
    scheduledDateTime: date.toISOString(),
    date: `${date.getFullYear()}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function clipText(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

export interface DemoAiStudentContext {
  studentId: number;
  name: string;
  learningLevel: string;
  statusLabel: string;
  module: string;
  recentThemes: string;
  performanceSummary: string;
}
