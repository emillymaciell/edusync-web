import { GeneratedTaskQuestion, GeneratedTaskResponse } from '../core/models/task.model';

const EXAMPLE_MARK = 'Exemplo alternativo.';

export function fallbackLesson(topic: string | undefined): { generatedContent: string } {
  const title = topic?.trim() || 'Present Perfect';
  const generatedContent = [
    `1. ${title}`,
    `${EXAMPLE_MARK} This sample lesson covers ${title} so the class can continue without a live AI response.`,
    'Foco personalizado: practice short sentences and check the verb form before moving on.',
    '',
    '2. How the form works',
    'Use subject + have/has + past participle. He, she and it take has. The other pronouns take have.',
    '',
    '3. Signal words',
    'Already, yet, just, ever, never, for and since tell the listener when the action matters. Since marks the start. For marks the duration.',
    '',
    '4. Present Perfect or Past Simple',
    'Choose the Past Simple when the moment is finished. Choose the Present Perfect when the result still matters now.',
    '',
    '5. Guided practice',
    `Write four sentences about ${title} and one sentence about something you have not done yet.`,
  ].join('\n');

  return { generatedContent };
}

export function fallbackExercises(assunto: string, nivel: string): GeneratedTaskResponse {
  const theme = assunto.trim() || 'Present Perfect';
  const first = `I have studied ${theme} before.`;
  const second = 'She has just finished the exercise.';
  const third = 'They have not seen that film.';

  return {
    tema: theme,
    nivel: nivel.trim() || 'INTERMEDIARIO',
    questoes: [
      question(
        `Qual frase usa o tema "${theme}" de forma correta?`,
        [first, `I have study ${theme} before.`, `I studied have ${theme} before.`],
        first,
        `${EXAMPLE_MARK} A forma correta é have/has + particípio.`,
      ),
      question(
        'Qual opção completa: "She ___ just finished the exercise."?',
        [second, 'She have just finished the exercise.', 'She did just finished the exercise.'],
        second,
        `${EXAMPLE_MARK} She, he e it usam has.`,
      ),
      question(
        'Qual é a frase negativa correta?',
        [third, 'They have not saw that film.', 'They no have seen that film.'],
        third,
        `${EXAMPLE_MARK} A negativa usa have/has + not + particípio.`,
      ),
    ],
  };
}

export function fallbackInsight(studentName: string): { analysis: string; recommendations: string[] } {
  const name = studentName.trim() || 'O aluno';
  return {
    analysis: `${EXAMPLE_MARK} ${name} não recebeu uma análise nova da IA nesta tentativa. O texto abaixo é só um exemplo para a conversa pedagógica continuar: revise o que já foi entregue, mantenha uma prática curta e não trate este parágrafo como uma geração concluída.`,
    recommendations: [
      'Revisar o último quiz e comparar cada resposta com o gabarito.',
      'Pedir quatro frases curtas sobre o tema da semana.',
      'Separar um erro recorrente e corrigi-lo em voz alta.',
      'Retomar a trilha atual antes de abrir um módulo novo.',
    ],
  };
}

export function isExampleText(value: string): boolean {
  return value.includes(EXAMPLE_MARK);
}

function question(
  enunciado: string,
  opcoes: string[],
  respostaCorreta: string,
  explicacao: string,
): GeneratedTaskQuestion {
  return { enunciado, opcoes, respostaCorreta, explicacao };
}
