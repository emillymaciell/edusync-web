import { UserRole } from './user.model';

export type BackendRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: BackendRole;
  subjectId?: number;
}

export interface AuthResponse {
  token: string;
  tokenType?: string;
  userId: number;
  name?: string;
  email?: string;
  role: BackendRole;
  forcePasswordChange?: boolean;
  subjectName?: string;
  subjectId?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

const BACKEND_ROLE_TO_APP_ROLE: Record<BackendRole, UserRole> = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export function mapBackendRole(role: BackendRole): UserRole {
  return BACKEND_ROLE_TO_APP_ROLE[role];
}
