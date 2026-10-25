import type { Messages } from '../i18n/ko';

export type Project = {
  slug: keyof Messages['projectItems'];
  type?: keyof Messages['projectTypes'];
  origin: keyof Messages['projectOrigins'];
  lifecycle?: keyof Messages['projectStatuses'];
  technologies?: string[];
  customerName?: string;
  startedOn?: string;
  endedOn?: string;
  thumbnail?: string;
  placeholder?: boolean;
  isVisible: boolean;
};

// shortcut: 프로젝트와 유형은 TS로 관리, 관리자 작성 기능 구현 시 DB로 이전.
export const projects: Project[] = [
  {
    slug: 'project-oz',
    origin: 'personal',
    startedOn: '2026-10-20',
    isVisible: true,
    type: 'website',
    lifecycle: 'BUILDING',
    technologies: [
      'React',
      'Next.js',
      'TypeScript',
      'PostgreSQL',
      'Prisma',
      'Mantine',
      'Tiptap',
    ],
  },
  {
    slug: 'ak-is',
    origin: 'company',
    lifecycle: 'BUILDING',
    customerName: 'AK아이에스',
    startedOn: '2026-06-01',
    isVisible: true,
  },
  {
    slug: 'jeju-air',
    origin: 'company',
    customerName: '제주항공',
    startedOn: '2026-02-01',
    endedOn: '2026-06-01',
    isVisible: true,
  },
  {
    slug: 'surplus-global',
    origin: 'company',
    customerName: '서플러스글로벌',
    startedOn: '2024-11-01',
    endedOn: '2025-12-01',
    isVisible: true,
  },
  {
    slug: 'nh-farming',
    origin: 'company',
    customerName: '농협',
    startedOn: '2024-01-01',
    endedOn: '2024-10-01',
    isVisible: true,
  },
  {
    slug: 'nonghyup-mall',
    origin: 'company',
    customerName: '농협',
    startedOn: '2023-02-01',
    endedOn: '2023-12-01',
    isVisible: true,
  },
  {
    slug: 'moim',
    origin: 'education',
    startedOn: '2022-11-05',
    endedOn: '2022-12-09',
    isVisible: true,
  },
  {
    slug: 'jogong',
    origin: 'education',
    startedOn: '2022-09-18',
    endedOn: '2022-10-16',
    isVisible: true,
  },
];

export function getPublicProjects(items: Project[] = projects) {
  return items
    .filter((project) => project.isVisible)
    .sort(
      (a, b) =>
        (b.startedOn ?? '').localeCompare(a.startedOn ?? '') ||
        a.slug.localeCompare(b.slug),
    );
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
