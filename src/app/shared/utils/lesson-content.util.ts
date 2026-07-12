import { GeneratedLessonResponse } from '../../core/models/lesson.model';

export interface ParsedLessonSection {
  title: string;
  body: string;
  focus?: string;
}

export function parseLessonContent(raw: string | null | undefined): ParsedLessonSection[] {
  if (!raw?.trim()) return [];

  const text = raw.trim();

  const blocks = text
    .split(/(?=\n\d+\.\s)|(?=^\d+\.\s)/m)
    .map((block) => block.trim())
    .filter(Boolean);

  const numberedBlocks = blocks.filter((block) => /^\d+\.\s/.test(block));
  if (numberedBlocks.length === 0) return [];

  return numberedBlocks.map((block) => {
    const lines = block.split('\n');
    const title = lines[0]?.trim() ?? '';
    const bodyLines: string[] = [];
    let focus: string | undefined;

    for (const line of lines.slice(1)) {
      const focusMatch = line.match(/^Foco personalizado:\s*(.*)$/i);
      if (focusMatch) {
        focus = focusMatch[1]?.trim();
      } else {
        bodyLines.push(line);
      }
    }

    return {
      title,
      body: bodyLines.join('\n').trim(),
      focus,
    };
  });
}

export function extractGeneratedContent(
  content: GeneratedLessonResponse | string | null | undefined
): string {
  if (content == null) return '';

  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed) as { generatedContent?: unknown };
      if (typeof parsed?.generatedContent === 'string') {
        return parsed.generatedContent;
      }
    } catch {
    }

    return trimmed;
  }

  return typeof content.generatedContent === 'string' ? content.generatedContent : '';
}
