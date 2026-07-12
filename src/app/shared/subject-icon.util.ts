import { SubjectIconKey } from '../core/models/subject.model';
import { IconName } from './ui/icon/icon';

const SUBJECT_ICON_MAP: Record<SubjectIconKey, IconName> = {
  languages: 'book',
  math: 'chart',
  humanities: 'edit',
  tech: 'code',
  arts: 'music',
};

const ICON_ALIASES: Record<string, SubjectIconKey> = {
  language: 'languages',
  languages: 'languages',
  math: 'math',
  humanities: 'humanities',
  tech: 'tech',
  arts: 'arts',
};

export function normalizeSubjectIcon(icon: string | undefined): SubjectIconKey {
  if (!icon) return 'languages';
  const key = icon.toLowerCase();
  return ICON_ALIASES[key] ?? 'languages';
}

export function subjectIconFor(icon: SubjectIconKey): IconName {
  return SUBJECT_ICON_MAP[icon] ?? 'book';
}

export const SUBJECT_ICON_OPTIONS: { key: SubjectIconKey; label: string; icon: IconName }[] = [
  { key: 'languages', label: 'Idiomas', icon: 'book' },
  { key: 'math', label: 'Exatas', icon: 'chart' },
  { key: 'humanities', label: 'Humanas', icon: 'edit' },
  { key: 'tech', label: 'Tecnologia', icon: 'code' },
  { key: 'arts', label: 'Artes', icon: 'music' },
];
