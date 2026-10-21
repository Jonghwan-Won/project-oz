export type Idea = {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
};

export const initialIdeas: Idea[] = [
  {
    id: 'IDEA-001',
    title: '생각을 모으는 마인드맵',
    content:
      '아이디어를 자유롭게 적어두고, 쌓인 내용을 마인드맵처럼 한눈에 보고 싶다.\n정리되지 않은 생각도 일단 담아둘 수 있는 공간.',
    category: '제품',
    status: '아이디어',
  },
  {
    id: 'IDEA-002',
    title: '언어별 코드 놀이터',
    content:
      'JS, TS, React, Vue, Java를 선택하고 코드를 실행해 출력이나 화면을 확인하는 공간.\n현재는 설계 초안만 작성한 상태.',
    category: '개발',
    status: '설계 초안',
  },
  {
    id: 'IDEA-003',
    title: 'DB 실험 공간',
    content:
      '연결과 쿼리를 테스트하는 놀이터.\n운영 DB와 분리한 실험 환경에서 시작하고 싶다.',
    category: '개발',
    status: '설계 초안',
  },
  {
    id: 'IDEA-004',
    title: '예약 작업 한눈에 보기',
    content:
      'NAS 배치와 Codex 예약 작업의 일정, 최근 결과, 결과물 링크를 OZ에서 보고 싶다.\n자동 연동 방식은 아직 정하지 않았다.',
    category: '자동화',
    status: '아이디어',
  },
];

export function createIdea(
  content: string,
  category: string,
  id: string,
): Idea {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 3000)
    throw new Error('아이디어는 1~3,000자로 입력해 주세요.');
  return {
    id,
    title: trimmed.split(/\r?\n/)[0].slice(0, 60),
    content,
    category,
    status: '아이디어',
  };
}

export function mapLayout(count: number) {
  const rows = Math.ceil(count / 2);
  const height = Math.max(400, rows * 140 + 80);
  return {
    height,
    nodes: Array.from({ length: count }, (_, index) => ({
      left: index % 2 === 0 ? 28 : 552,
      top: (height - rows * 140 + 40) / 2 + Math.floor(index / 2) * 140,
    })),
  };
}

export type IdeaBranch = Idea & { ideaId: string; parentId: string | null };

export const initialBranches: IdeaBranch[] = [
  {
    ...createIdea(
      '사용자별 비공개 저장\n로그인한 사용자의 아이디어만 조회하고 수정한다.',
      '설계',
      'branch-1',
    ),
    ideaId: 'IDEA-001',
    parentId: null,
  },
  {
    ...createIdea(
      '모바일 정렬 방식\n드래그 외에 숫자로도 순서를 바꿀 수 있어야 한다.',
      '구현 이슈',
      'branch-2',
    ),
    ideaId: 'IDEA-001',
    parentId: null,
  },
];

export function reorderIdeas(ideas: Idea[], id: string, position: number) {
  if (!Number.isInteger(position) || position < 1 || position > ideas.length)
    throw new Error(`우선순위는 1~${ideas.length} 사이 정수로 입력해 주세요.`);
  const idea = ideas.find((item) => item.id === id);
  if (!idea) throw new Error('아이디어를 찾을 수 없습니다.');
  const next = ideas.filter((item) => item.id !== id);
  next.splice(position - 1, 0, idea);
  return next;
}
