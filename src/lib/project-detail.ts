import type { PublicProject } from '@/server/services/projects';
import type { Messages } from '@/i18n/ko';
import type { UploadedAsset } from './files';
export type ProjectDetailData = {
  title: string;
  summary: string;
  body: unknown;
  thumbnail: string | null;
  customerName: string;
  originLabel: string;
  typeLabel: string;
  statusLabel: string;
  technologies: string[];
  tags: string[];
  attachments: UploadedAsset[];
  contentLocale: string;
  placeholder: boolean;
};
export function publicProjectDetail(
  project: PublicProject,
  labels: Messages,
): ProjectDetailData {
  return {
    ...project,
    customerName: project.customerName || '',
    typeLabel: project.typeLabel || '',
    statusLabel: project.lifecycle
      ? labels.projectStatuses[project.lifecycle]
      : '',
    technologies: project.tags
      .filter((tag) => tag.kind === 'TECHNOLOGY')
      .map((tag) => tag.name),
    tags: project.tags
      .filter((tag) => tag.kind === 'TOPIC')
      .map((tag) => tag.name),
  };
}
