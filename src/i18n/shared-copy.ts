/**
 * 서버·클라이언트 양쪽 트리에서 쓰는 공용 컴포넌트(프로젝트 상세·카드·미리보기, 연락처 카드)의 문구.
 * 이 컴포넌트들은 locale만 받으므로 ko.ts/en.ts 전체 대신 이 작은 사전을 locale로 고른다.
 */
const ko = {
  projectDetail: {
    period: '작업 기간',
    client: '고객사',
    origin: '작업 구분',
    type: '프로젝트 유형',
    untitled: '제목 없는 프로젝트',
    technologies: '사용 기술',
    attachments: '첨부파일',
    tags: '태그',
    fallbackNotice: '선택한 언어의 번역을 준비하고 있어 원문을 표시합니다.',
  },
  projectPreview: {
    title: '프로젝트 상세',
    close: '닫기',
    loadFailed: '프로젝트 상세를 불러오지 못했습니다.',
  },
  projectCard: {
    technologies: '대표 기술',
  },
  contactCard: {
    copy: '이메일 주소 복사',
    copied: '복사 완료',
    copyFailed: '복사하지 못했습니다. 주소를 직접 복사해 주세요.',
    github: 'GitHub (새 탭에서 열기)',
  },
};

export type SharedCopy = typeof ko;

const en = {
  projectDetail: {
    period: 'Period',
    client: 'Client',
    origin: 'Origin',
    type: 'Type',
    untitled: 'Untitled project',
    technologies: 'Technologies',
    attachments: 'Attachments',
    tags: 'Tags',
    fallbackNotice:
      'A translation is being prepared. Showing the original text.',
  },
  projectPreview: {
    title: 'Project details',
    close: 'Close',
    loadFailed: 'Could not load the project details.',
  },
  projectCard: {
    technologies: 'Key technologies',
  },
  contactCard: {
    copy: 'Copy email address',
    copied: 'Copied',
    copyFailed: 'Copy failed. Please copy the address manually.',
    github: 'GitHub (opens in a new tab)',
  },
} satisfies SharedCopy;

export function sharedCopy(locale: string | undefined): SharedCopy {
  return locale === 'en' ? en : ko;
}
