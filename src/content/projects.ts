import type { Messages } from '../i18n/ko';

export type Project = {
  slug: keyof Messages['projectItems'];
  type?: keyof Messages['projectTypes'];
  origin: keyof Messages['projectOrigins'];
  lifecycle?: keyof Messages['projectStatuses'];
  customerName?: string;
  startedOn?: string;
  endedOn?: string;
  order: number;
  thumbnail?: string;
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
    lifecycle: 'BUILDING',
    customerName: 'AK아이에스',
    startedOn: '2026-06-01',
    order: 2,
    visibility: 'PUBLIC',
  },
  {
    slug: 'jeju-air',
    origin: 'company',
    customerName: '제주항공',
    startedOn: '2026-02-01',
    endedOn: '2026-06-01',
    order: 3,
    visibility: 'PUBLIC',
  },
  {
    slug: 'surplus-global',
    origin: 'company',
    customerName: '서플러스글로벌',
    startedOn: '2024-11-01',
    endedOn: '2025-12-01',
    order: 4,
    visibility: 'PUBLIC',
  },
  {
    slug: 'nh-farming',
    origin: 'company',
    customerName: '농협',
    startedOn: '2024-01-01',
    endedOn: '2024-10-01',
    order: 5,
    visibility: 'PUBLIC',
  },
  {
    slug: 'nonghyup-mall',
    origin: 'company',
    customerName: '농협',
    startedOn: '2023-02-01',
    endedOn: '2023-12-01',
    order: 6,
    visibility: 'PUBLIC',
  },
  {
    slug: 'moim',
    origin: 'education',
    startedOn: '2022-11-05',
    endedOn: '2022-12-09',
    order: 7,
    visibility: 'PUBLIC',
  },
  {
    slug: 'jogong',
    origin: 'education',
    startedOn: '2022-09-18',
    endedOn: '2022-10-16',
    order: 8,
    visibility: 'PUBLIC',
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
