export type SubjectIconKey = 'languages' | 'math' | 'humanities' | 'tech' | 'arts';
export type SubjectStatus = 'Ativa' | 'Rascunho';

export type ApiSubjectStatus = 'ATIVA' | 'INATIVA';

export interface SubjectResponse {
  id: number;
  name: string;
  description: string;
  teachingArea: string;
  color: string;
  icon: string;
  status: ApiSubjectStatus;
  teacherCount: number;
}

export interface SubjectRequest {
  name: string;
  description?: string;
  teachingArea: string;
  color: string;
  icon: string;
  status?: ApiSubjectStatus;
}

export const SUBJECT_API_STATUS_LABEL: Record<ApiSubjectStatus, string> = {
  ATIVA: 'Ativa',
  INATIVA: 'Rascunho',
};

export interface Subject {
  id: number;
  name: string;
  area: string;
  description: string;
  color: string;
  icon: SubjectIconKey;
  status: SubjectStatus;
  teacherCount: number;
}
