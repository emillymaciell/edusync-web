export type TaskApiStatus = 'PENDENTE' | 'ENTREGUE' | 'ENVIADA' | 'CORRIGIDA' | 'ATRASADA';

export interface TaskResponse {
  id: number;
  title: string;
  studentName: string;
  dueDate: string | null;
  status: TaskApiStatus;
  description: string;
  studentAnswer: string | null;
}

export interface StudentTaskResponse {
  id: number;
  title: string;
  description: string;
  dueDate: string | null;
  status: TaskApiStatus;
  studentAnswer: string | null;
}

export interface SubmitStudentTaskRequest {
  answer: string;
}

export const TASK_API_STATUS_LABEL: Record<TaskApiStatus, string> = {
  PENDENTE: 'Pendente',
  ENTREGUE: 'Entregue',
  ENVIADA: 'Enviada',
  CORRIGIDA: 'Corrigida',
  ATRASADA: 'Atrasada',
};

export interface SaveTaskRequest {
  studentId: number;
  title: string;
  content: GeneratedTaskResponse;
}

export type TaskStatus = 'pendente' | 'atrasada' | 'entregue' | 'corrigida';

export interface TaskAssignee {
  studentId: number;
  initials: string;
  color: string;
}

export interface TeacherTask {
  id: string;
  title: string;
  description: string;
  module: string;
  dueDate: string;
  status: TaskStatus;
  attachmentName?: string;
  assignees: TaskAssignee[];
}

export interface StudentTask {
  id: string;
  title: string;
  description: string;
  module: string;
  dueDate: string;
  status: TaskStatus;
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  atrasada: 'Atrasada',
  entregue: 'Entregue',
  corrigida: 'Corrigida',
};

export interface GenerateTaskRequest {
  assunto: string;
  nivelAluno: string;
  tipoExercicio: string;
}

export interface GeneratedTaskQuestion {
  enunciado: string;
  opcoes: string[];
  respostaCorreta: string;
  explicacao: string;
}

export interface GeneratedTaskResponse {
  tema: string;
  nivel: string;
  questoes: GeneratedTaskQuestion[];
}
