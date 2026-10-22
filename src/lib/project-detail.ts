import type { PublicProject } from '@/server/services/projects';
import type { UploadedAsset } from './files';
export type ProjectDetailData = {
  title: string;
  summary: string;
  body: unknown;
  thumbnail: string | null;
  customerName: string;
  period: string;
  originLabel: string;
  typeLabel: string;
  technologies: string[];
  tags: string[];
  attachments: UploadedAsset[];
  contentLocale: string;
  placeholder: boolean;
};
export function formatProjectPeriod(
  startedOn: string | null | undefined,
  endedOn: string | null | undefined,
  locale = 'ko',
) {
  if (!startedOn) return '';
  // shortcut: dates on the first represent month-only precision, add precision metadata if exact first-day dates are needed.
  const format = (date: string) =>
    date.endsWith('-01')
      ? date.slice(0, 7).replace('-', '.')
      : date.replace(/-/g, '.');
  return `${format(startedOn)} ~ ${endedOn ? format(endedOn) : locale === 'en' ? 'Present' : '현재'}`;
}
export function publicProjectDetail(
  project: PublicProject,
  locale: string = 'ko',
): ProjectDetailData {
  return {
    ...project,
    customerName: project.customerName || '',
    period: formatProjectPeriod(project.startedOn, project.endedOn, locale),
    typeLabel: project.typeLabel || '',
    technologies: project.tags
      .filter((tag) => tag.kind === 'TECHNOLOGY')
      .map((tag) => tag.name),
    tags: project.tags
      .filter((tag) => tag.kind === 'TOPIC')
      .map((tag) => tag.name),
  };
}
