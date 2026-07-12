export type LiveClassApiStatus = 'AGENDADA' | 'EM_BREVE' | 'FINALIZADA';

export const LIVE_CLASS_API_STATUS_LABEL: Record<LiveClassApiStatus, string> = {
  AGENDADA: 'Agendada',
  EM_BREVE: 'Em breve',
  FINALIZADA: 'Finalizada',
};

export interface LiveClassParticipant {
  studentId: number;
  name: string;
}

export interface LiveClassListResponse {
  upcoming: LiveClassResponse[];
  finished: LiveClassResponse[];
}

export interface LiveClassResponse {
  id: number;
  title: string;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  scheduledDateTime?: string | null;
  status: LiveClassApiStatus | string;
  meetLink?: string | null;
  teacherName?: string | null;
  teacher?: { name?: string | null; user?: { name?: string | null } | null } | null;
  participants?: LiveClassParticipant[] | null;
}

export interface CreateLiveClassRequest {
  title: string;
  description: string;
  scheduledDateTime: string;
  studentIds: number[];
}

export interface LiveClass {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'Agendada' | 'Em breve' | 'Finalizada';
  participants: { initials: string; color: string; name: string }[];
  meetLink: string;
}

export interface GeneratedLesson {
  title: string;
  level: string;
  objective: string;
  warmUp: string;
  activities: { title: string; description: string }[];
  vocabulary: string[];
  homework: string;
}

export interface GenerateLessonRequest {
  studentId: number;
  topic: string;
  observations?: string;
}

export interface GeneratedLessonResponse {
  generatedContent: string;
}

export interface SaveLessonRequest {
  studentId: number;
  topic: string;
  content: GeneratedLessonResponse;
}

export interface LessonResponse {
  id: number;
}

export interface SavedLesson {
  id: number;
  topic: string;
  studentId?: number;
  studentName: string;
  createdAt: string;
  content?: GeneratedLessonResponse | string;
}

export interface UpdateLessonRequest {
  topic: string;
  content: GeneratedLessonResponse;
}
