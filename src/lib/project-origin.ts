/** 작업 구분 코드를 공개 화면의 두 묶음(개인·교육 / 실무)으로 나눈다. */
export const projectGroups = ['personal', 'work'] as const;
export type ProjectGroup = (typeof projectGroups)[number];

const groupByOrigin: Record<string, ProjectGroup> = {
  PERSONAL: 'personal',
  EDUCATION: 'personal',
  COMPANY: 'work',
};

/** 관리자가 새로 만든 코드처럼 묶음이 정해지지 않은 코드는 null이다. */
export function projectGroupOf(originCode: string): ProjectGroup | null {
  return groupByOrigin[originCode] ?? null;
}
