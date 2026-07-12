export type StudentStatus = 'em-dia' | 'atencao' | 'em-risco';

export interface TeacherStudent {
  id: number;
  name: string;
  email?: string;
  currentModule: string;
  status: StudentStatus;
  progress: number;
  lastActivity: string;
  pendingTasks: number;
  nextClass: string;
  avatarInitials: string;
  avatarColor: string;
}

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  'em-dia': 'Em dia',
  'atencao': 'Atenção',
  'em-risco': 'Em risco',
};

export type StudentApiStatus = 'EM_DIA' | 'ATENCAO' | 'EM_RISCO';

export interface CreateStudentRequest {
  name: string;
  email: string;
  learningLevel?: string;
}

export interface Student {
  id: number;
  userId: number;
  name: string;
  email: string;
  teacherId: number | null;
  learningLevel: string;
  status: StudentApiStatus;
}

export const STUDENT_API_STATUS_LABEL: Record<StudentApiStatus, string> = {
  EM_DIA: 'Em dia',
  ATENCAO: 'Atenção',
  EM_RISCO: 'Em risco',
};
