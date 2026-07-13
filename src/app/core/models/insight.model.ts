export interface StudentInsightResponse {
  studentId: number;
  module: string;
  status: string;
  analysis: string;
  recommendations: string[];
  updatedAt: string;
}

export interface TrilhaStep {
  name: string;
  status: 'concluido' | 'atual' | 'bloqueado';
}

export interface Achievement {
  title: string;
  description: string;
  date: string;
  icon: 'trophy' | 'flame' | 'star';
}

export interface StudentProgressSummary {
  overallProgress: number;
  modulesCompleted: number;
  totalModules: number;
  lessonsWatched: number;
  totalLessons: number;
  tasksSubmitted: number;
  totalTasks: number;
  trilha: TrilhaStep[];
  achievements: Achievement[];
}
