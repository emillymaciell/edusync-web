import { BackendRole } from '../core/models/auth.model';
import { Achievement, StudentInsightResponse, TrilhaStep } from '../core/models/insight.model';
import { LiveClassApiStatus } from '../core/models/lesson.model';
import { GeneratedTaskResponse } from '../core/models/task.model';
import { StudentApiStatus } from '../core/models/student.model';
import { ApiSubjectStatus, SubjectIconKey } from '../core/models/subject.model';
import { ApprovalStatus } from '../core/models/teacher.model';
import { TaskApiStatus } from '../core/models/task.model';

/** Valores que as telas do professor já reconhecem. Não há enum LearningLevel nos models. */
export const LEARNING_LEVEL = {
  INICIANTE: 'INICIANTE',
  INTERMEDIARIO: 'INTERMEDIARIO',
  AVANCADO: 'AVANCADO',
} as const;

export type LearningLevel = (typeof LEARNING_LEVEL)[keyof typeof LEARNING_LEVEL];

export const DEMO_DEFAULT_STUDENT_PASSWORD = 'edusync123';

export const DEMO_ACCOUNTS = {
  admin: {
    name: 'Administrador EduSync',
    email: 'admin@edusync.com',
    password: 'Admin@123',
  },
  ana: {
    name: 'Ana Souza',
    email: 'prof.ana@edusync.com',
    password: 'Ana@1234',
  },
  camila: {
    name: 'Camila Cruz',
    email: 'camila@gmail.com',
    password: 'Camila@123',
  },
  lucas: {
    name: 'Lucas Almeida',
    email: 'lucas@gmail.com',
    password: 'Lucas@123',
  },
  fernando: {
    name: 'Fernando Santos',
    email: 'prof.fernando@edusync.com',
    password: 'Fernando@123',
  },
} as const;

export const MODULE_TRACK = [
  'Fundamentos',
  'Present Simple',
  'Past Simple',
  'Present Perfect',
  'Conversação Avançada',
] as const;

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: BackendRole;
  forcePasswordChange: boolean;
}

export interface DemoSubject {
  id: number;
  name: string;
  description: string;
  teachingArea: string;
  color: string;
  icon: SubjectIconKey;
  status: ApiSubjectStatus;
}

export interface DemoTeacher {
  id: number;
  userId: number;
  approvalStatus: ApprovalStatus;
  bio: string | null;
  subjectIds: number[];
}

export interface DemoStudent {
  id: number;
  userId: number;
  teacherId: number;
  learningLevel: LearningLevel;
  status: StudentApiStatus;
}

export interface DemoTask {
  id: number;
  teacherUserId: number;
  studentId: number;
  title: string;
  description: string;
  dueDate: string | null;
  status: TaskApiStatus;
  studentAnswer: string | null;
  grade: number | null;
}

export interface DemoLesson {
  id: number;
  teacherUserId: number;
  studentId: number;
  topic: string;
  content: { generatedContent: string };
  createdAt: string;
}

export interface DemoLiveClass {
  id: number;
  teacherUserId: number;
  title: string;
  description: string;
  scheduledDateTime: string;
  date: string;
  time: string;
  status: LiveClassApiStatus;
  meetLink: string;
  studentIds: number[];
}

export interface DemoProgressProfile {
  studentId: number;
  modulesCompleted: number;
  totalModules: number;
  lessonsWatched: number;
  totalLessons: number;
  trilha: TrilhaStep[];
  achievements: Achievement[];
}

export interface DemoSequences {
  user: number;
  subject: number;
  teacher: number;
  student: number;
  task: number;
  lesson: number;
  liveClass: number;
}

export interface DemoState {
  users: DemoUser[];
  subjects: DemoSubject[];
  teachers: DemoTeacher[];
  students: DemoStudent[];
  tasks: DemoTask[];
  lessons: DemoLesson[];
  liveClasses: DemoLiveClass[];
  insights: StudentInsightResponse[];
  progress: DemoProgressProfile[];
  sequences: DemoSequences;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildTrilha(currentIndex: number): TrilhaStep[] {
  return MODULE_TRACK.map((name, index) => ({
    name,
    status: index < currentIndex ? 'concluido' : index === currentIndex ? 'atual' : 'bloqueado',
  }));
}

export function createDemoState(now = Date.now()): DemoState {
  const correctedQuiz: GeneratedTaskResponse = {
    tema: 'Present Perfect — revisão',
    nivel: LEARNING_LEVEL.INTERMEDIARIO,
    questoes: [
      {
        enunciado: 'Qual frase está no Present Perfect?',
        opcoes: [
          'I have lived here for two years.',
          'I live here for two years.',
          'I am live here for two years.',
        ],
        respostaCorreta: 'I have lived here for two years.',
        explicacao: 'A forma é have/has + particípio. "Lived" é o particípio de live.',
      },
      {
        enunciado: 'Qual auxiliar completa: "She ___ finished the homework."?',
        opcoes: ['has', 'have', 'did'],
        respostaCorreta: 'has',
        explicacao: 'She, he e it usam has. Did pertence ao Past Simple.',
      },
      {
        enunciado: 'Na frase "I have already eaten", already indica:',
        opcoes: [
          'Uma ação concluída antes do momento da fala.',
          'Uma ação que acontece todo dia.',
          'Uma ação marcada para o futuro.',
        ],
        respostaCorreta: 'Uma ação concluída antes do momento da fala.',
        explicacao: 'Already situa a ação como já realizada até agora.',
      },
      {
        enunciado: 'Qual é o particípio correto do verbo write?',
        opcoes: ['written', 'writed', 'wrote'],
        respostaCorreta: 'written',
        explicacao: 'Write é irregular: write, wrote, written.',
      },
      {
        enunciado: 'Qual é a frase negativa correta?',
        opcoes: [
          'I have not seen that film.',
          'I have not saw that film.',
          'I no have seen that film.',
        ],
        respostaCorreta: 'I have not seen that film.',
        explicacao: 'A negativa usa have/has + not + particípio. Saw é passado simples.',
      },
    ],
  };

  const pendingQuiz: GeneratedTaskResponse = {
    tema: 'Present Perfect na prática',
    nivel: LEARNING_LEVEL.INTERMEDIARIO,
    questoes: [
      {
        enunciado: 'Qual opção completa: "They ___ just arrived."?',
        opcoes: ['have', 'has', 'are'],
        respostaCorreta: 'have',
        explicacao: 'They usa have. Just combina com o Present Perfect.',
      },
      {
        enunciado: 'Em uma pergunta, ever significa:',
        opcoes: ['Alguma vez na vida.', 'Ontem à noite.', 'Amanhã cedo.'],
        respostaCorreta: 'Alguma vez na vida.',
        explicacao: 'Ever pergunta se a experiência existiu em qualquer momento até agora.',
      },
      {
        enunciado: 'Qual frase está correta?',
        opcoes: [
          'She has visited Recife twice.',
          'She have visited Recife twice.',
          'She has visit Recife twice.',
        ],
        respostaCorreta: 'She has visited Recife twice.',
        explicacao: 'She + has + particípio. Visited é o particípio de visit.',
      },
    ],
  };

  // 4 acertos de 5: round(4 * 10 / 5) = 8. A quinta resposta é outra opção, de propósito.
  const correctedAnswers: Record<string, string> = {
    '0': correctedQuiz.questoes[0].respostaCorreta,
    '1': correctedQuiz.questoes[1].respostaCorreta,
    '2': correctedQuiz.questoes[2].respostaCorreta,
    '3': correctedQuiz.questoes[3].respostaCorreta,
    '4': correctedQuiz.questoes[4].opcoes[1],
  };

  const upcomingSoon = scheduleAt(now, 2, 19, 0);
  const upcomingLater = scheduleAt(now, 4, 15, 0);
  const finishedRecent = scheduleAt(now, -3, 19, 0);

  const lessonCreatedAt = new Date(now - 2 * DAY_MS).toISOString();

  return {
    users: [
      {
        id: 1,
        name: DEMO_ACCOUNTS.admin.name,
        email: DEMO_ACCOUNTS.admin.email,
        password: DEMO_ACCOUNTS.admin.password,
        role: 'ADMIN',
        forcePasswordChange: false,
      },
      {
        id: 2,
        name: DEMO_ACCOUNTS.ana.name,
        email: DEMO_ACCOUNTS.ana.email,
        password: DEMO_ACCOUNTS.ana.password,
        role: 'TEACHER',
        forcePasswordChange: false,
      },
      {
        id: 3,
        name: DEMO_ACCOUNTS.camila.name,
        email: DEMO_ACCOUNTS.camila.email,
        password: DEMO_ACCOUNTS.camila.password,
        role: 'STUDENT',
        forcePasswordChange: false,
      },
      {
        id: 4,
        name: DEMO_ACCOUNTS.lucas.name,
        email: DEMO_ACCOUNTS.lucas.email,
        password: DEMO_ACCOUNTS.lucas.password,
        role: 'STUDENT',
        forcePasswordChange: false,
      },
      {
        id: 5,
        name: DEMO_ACCOUNTS.fernando.name,
        email: DEMO_ACCOUNTS.fernando.email,
        password: DEMO_ACCOUNTS.fernando.password,
        role: 'TEACHER',
        forcePasswordChange: false,
      },
    ],
    subjects: [
      {
        id: 1,
        name: 'Inglês',
        description: 'Conversação, gramática e compreensão de textos em inglês.',
        teachingArea: 'Idiomas',
        color: '#2563eb',
        icon: 'languages',
        status: 'ATIVA',
      },
      {
        id: 2,
        name: 'Matemática',
        description: 'Números, álgebra e resolução de problemas do ensino básico.',
        teachingArea: 'Exatas',
        color: '#d97706',
        icon: 'math',
        status: 'ATIVA',
      },
      {
        id: 3,
        name: 'Programação',
        description: 'Lógica, algoritmos e primeiros programas em uma linguagem.',
        teachingArea: 'Tecnologia',
        color: '#7c3aed',
        icon: 'tech',
        status: 'ATIVA',
      },
      {
        id: 4,
        name: 'Redação',
        description: 'Estrutura de texto, coesão e prática de escrita.',
        teachingArea: 'Idiomas',
        color: '#db2777',
        icon: 'languages',
        status: 'ATIVA',
      },
    ],
    teachers: [
      {
        id: 1,
        userId: 2,
        approvalStatus: 'APROVADO',
        bio: 'Professora de inglês. Acompanha turmas de nível intermediário.',
        subjectIds: [1],
      },
      {
        id: 2,
        userId: 5,
        approvalStatus: 'PENDENTE',
        bio: null,
        subjectIds: [2],
      },
    ],
    students: [
      {
        id: 1,
        userId: 3,
        teacherId: 1,
        learningLevel: LEARNING_LEVEL.INTERMEDIARIO,
        status: 'EM_DIA',
      },
      {
        id: 2,
        userId: 4,
        teacherId: 1,
        learningLevel: LEARNING_LEVEL.INICIANTE,
        status: 'EM_RISCO',
      },
    ],
    tasks: [
      {
        id: 1,
        teacherUserId: 2,
        studentId: 1,
        title: 'Quiz: Present Perfect',
        description: JSON.stringify(pendingQuiz),
        dueDate: new Date(now + 5 * DAY_MS).toISOString(),
        status: 'PENDENTE',
        studentAnswer: null,
        grade: null,
      },
      {
        id: 2,
        teacherUserId: 2,
        studentId: 1,
        title: 'Quiz: Present Perfect — revisão',
        description: JSON.stringify(correctedQuiz),
        dueDate: new Date(now - 6 * DAY_MS).toISOString(),
        status: 'CORRIGIDA',
        studentAnswer: JSON.stringify(correctedAnswers),
        grade: 8,
      },
      {
        id: 3,
        teacherUserId: 2,
        studentId: 2,
        title: 'Vocabulário da última aula',
        description:
          'Escreva cinco frases em inglês usando o vocabulário da última aula. Uma frase para cada palavra nova.',
        dueDate: new Date(now - DAY_MS).toISOString(),
        status: 'ATRASADA',
        studentAnswer: null,
        grade: null,
      },
    ],
    lessons: [
      {
        id: 1,
        teacherUserId: 2,
        studentId: 1,
        topic: 'Present Perfect',
        createdAt: lessonCreatedAt,
        content: {
          generatedContent: [
            '1. O que é o Present Perfect',
            'O Present Perfect liga uma ação do passado ao presente. Quem já entende o Past Simple consegue comparar as duas formas em situações do dia a dia.',
            'Foco personalizado: montar frases com have/has + particípio sobre experiências de viagem.',
            '',
            '2. Como formar a frase',
            'A ordem é sujeito + have/has + particípio. He, she e it usam has. Os outros pronomes usam have.',
            '',
            '3. Palavras que acompanham o tempo',
            'Already, yet, just, ever, never, for e since situam a ação. Since marca o início e for marca a duração.',
            '',
            '4. Present Perfect ou Past Simple',
            'Se o momento ficou fechado no passado, use o Past Simple. Se o resultado ainda importa agora, use o Present Perfect.',
            '',
            '5. Prática guiada',
            'Escreva quatro frases sobre lugares que você já visitou e uma frase sobre algo que ainda não fez.',
          ].join('\n'),
        },
      },
    ],
    liveClasses: [
      liveClass(1, 2, 'Conversação: experiências e rotina', 'Prática oral de Present Perfect com exemplos do cotidiano.', upcomingSoon, 'AGENDADA', 'https://meet.google.com/edusync-demo-conversa', [1, 2]),
      liveClass(2, 2, 'Present Perfect na prática', 'Exercícios guiados de formação e palavras de sinal.', upcomingLater, 'AGENDADA', 'https://meet.google.com/edusync-demo-pratica', [1, 2]),
      liveClass(3, 2, 'Revisão de Past Simple', 'Aula já realizada sobre passado simples e vocabulário de rotina.', finishedRecent, 'FINALIZADA', 'https://meet.google.com/edusync-demo-revisao', [1, 2]),
    ],
    insights: [
      {
        studentId: 1,
        module: 'Past Simple',
        status: 'Em dia',
        analysis:
          'A Camila mantém o ritmo da turma de inglês. Ela já consolidou Fundamentos e Present Simple, está em Past Simple e acertou 4 de 5 questões no quiz de Present Perfect, com nota 8. O próximo passo é contrastar Past Simple e Present Perfect em frases próprias, sem pressa para abrir um módulo novo.',
        recommendations: [
          'Reforçar a diferença entre Past Simple e Present Perfect com exemplos do dia a dia.',
          'Pedir quatro frases sobre viagens usando have/has e o particípio.',
          'Revisar since e for antes da próxima aula ao vivo.',
          'Manter o quiz pendente de Present Perfect como prática curta desta semana.',
        ],
        updatedAt: new Date(now).toISOString(),
      },
    ],
    progress: [
      {
        studentId: 1,
        modulesCompleted: 2,
        totalModules: MODULE_TRACK.length,
        lessonsWatched: 8,
        totalLessons: 16,
        trilha: buildTrilha(2),
        achievements: [
          {
            title: 'Nota 8 no quiz',
            description: 'Acertou 4 de 5 questões na revisão de Present Perfect.',
            date: formatBrDate(now - 6 * DAY_MS),
            icon: 'trophy',
          },
          {
            title: 'Present Simple concluído',
            description: 'Fechou o módulo e seguiu para o Past Simple.',
            date: formatBrDate(now - 12 * DAY_MS),
            icon: 'star',
          },
          {
            title: 'Sequência de estudos',
            description: 'Manteve a prática de inglês por duas semanas.',
            date: formatBrDate(now - 3 * DAY_MS),
            icon: 'flame',
          },
        ],
      },
      {
        studentId: 2,
        modulesCompleted: 0,
        totalModules: MODULE_TRACK.length,
        lessonsWatched: 1,
        totalLessons: 10,
        trilha: buildTrilha(0),
        achievements: [],
      },
    ],
    sequences: {
      user: 5,
      subject: 4,
      teacher: 2,
      student: 2,
      task: 3,
      lesson: 1,
      liveClass: 3,
    },
  };
}

function scheduleAt(now: number, dayOffset: number, hours: number, minutes: number): ScheduledClass {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
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

interface ScheduledClass {
  scheduledDateTime: string;
  date: string;
  time: string;
}

function liveClass(
  id: number,
  teacherUserId: number,
  title: string,
  description: string,
  when: ScheduledClass,
  status: LiveClassApiStatus,
  meetLink: string,
  studentIds: number[],
): DemoLiveClass {
  return {
    id,
    teacherUserId,
    title,
    description,
    scheduledDateTime: when.scheduledDateTime,
    date: when.date,
    time: when.time,
    status,
    meetLink,
    studentIds,
  };
}

function formatBrDate(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));
}
