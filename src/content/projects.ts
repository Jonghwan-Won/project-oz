import type { Messages } from '../i18n/ko';

export type Project = {
  slug: keyof Messages['projectItems'];
  type?: keyof Messages['projectTypes'];
  origin: keyof Messages['projectOrigins'];
  lifecycle?: keyof Messages['projectStatuses'];
  order: number;
  placeholder?: boolean;
  visibility: 'PUBLIC' | 'PRIVATE';
};

// shortcut: 프로젝트와 유형은 TS로 관리, 관리자 작성 기능 구현 시 DB로 이전.
export const projects: Project[] = [
  {
    slug: 'project-oz',
    origin: 'personal',
    order: 1,
    visibility: 'PUBLIC',
    type: 'website',
    lifecycle: 'BUILDING',
  },
  {
    slug: 'ak-is',
    origin: 'company',
    order: 2,
    visibility: 'PUBLIC',
    placeholder: true,
  },
  {
    slug: 'jeju-air',
    origin: 'company',
    order: 3,
    visibility: 'PUBLIC',
    placeholder: true,
  },
  {
    slug: 'surplus-global',
    origin: 'company',
    order: 4,
    visibility: 'PUBLIC',
    placeholder: true,
  },
  {
    slug: 'nh-farming',
    origin: 'company',
    order: 5,
    visibility: 'PUBLIC',
    placeholder: true,
  },
  {
    slug: 'nonghyup-mall',
    origin: 'company',
    order: 6,
    visibility: 'PUBLIC',
    placeholder: true,
  },
  {
    slug: 'moim',
    origin: 'education',
    order: 7,
    visibility: 'PUBLIC',
    placeholder: true,
  },
  {
    slug: 'jogong',
    origin: 'education',
    order: 8,
    visibility: 'PUBLIC',
    placeholder: true,
  },
];

export function getPublicProjects(items: Project[] = projects) {
  return items
    .filter((project) => project.visibility === 'PUBLIC')
    .sort((a, b) => a.order - b.order);
}

export function getUsedProjectTypes(items: Project[] = projects) {
  return [
    ...new Set(
      getPublicProjects(items).flatMap((project) =>
        project.type ? [project.type] : [],
      ),
    ),
  ];
}
