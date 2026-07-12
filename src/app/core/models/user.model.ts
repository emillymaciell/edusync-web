export type UserRole = 'admin' | 'teacher' | 'student';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  avatarColor: string;
  title?: string;
  subjectName?: string;
  subjectId?: number;
  forcePasswordChange?: boolean;
}
