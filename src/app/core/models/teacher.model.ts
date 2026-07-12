import { SubjectResponse } from './subject.model';

export type ApprovalStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO';
export type TeacherStatus = 'Ativo' | 'Pendente';

export interface TeacherProfileResponse {
  id: number;
  userId: number;
  name: string;
  email: string;
  approvalStatus: ApprovalStatus;
  bio: string | null;
  subjects?: SubjectResponse[];
  subjectName?: string | null;
  subjectCategory?: string | null;
}

export interface TeacherReviewRequest {
  status: ApprovalStatus;
}

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Ativo',
  REJEITADO: 'Rejeitado',
};

export interface Teacher {
  id: number;
  name: string;
  email: string;
  subjectId: number | null;
  subjectName: string;
  subjectCategory: string;
  status: TeacherStatus;
  avatarInitials: string;
  avatarColor: string;
}
