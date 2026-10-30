export type PostCategory = {
  code: string;
  nameKo: string;
  nameEn: string;
  isActive: boolean;
};
export const defaultPostCategories: PostCategory[] = [
  {
    code: 'NOTICE',
    nameKo: '공지사항',
    nameEn: 'Notice',
    isActive: true,
  },
  {
    code: 'DEV_LOG',
    nameKo: '개발일지',
    nameEn: 'Development',
    isActive: true,
  },
  {
    code: 'AI',
    nameKo: 'AI 정보',
    nameEn: 'AI',
    isActive: true,
  },
  {
    code: 'TECH',
    nameKo: 'IT·기술',
    nameEn: 'Technology',
    isActive: true,
  },
  {
    code: 'ISSUE',
    nameKo: '실시간 이슈',
    nameEn: 'Current issues',
    isActive: true,
  },
  {
    code: 'ENTERTAINMENT',
    nameKo: '연예·문화',
    nameEn: 'Entertainment & culture',
    isActive: true,
  },
  {
    code: 'CAREER',
    nameKo: '채용·커리어',
    nameEn: 'Careers',
    isActive: true,
  },
  {
    code: 'FINANCE',
    nameKo: '주식·금융',
    nameEn: 'Finance',
    isActive: true,
  },
  {
    code: 'REAL_ESTATE',
    nameKo: '부동산',
    nameEn: 'Real estate',
    isActive: true,
  },
  {
    code: 'TROUBLESHOOTING',
    nameKo: '장애·이슈 해결',
    nameEn: 'Troubleshooting',
    isActive: true,
  },
  {
    code: 'OTHER',
    nameKo: '기타',
    nameEn: 'Other',
    isActive: true,
  },
];
const legacy: Record<string, string> = {
  '개발 기록': 'DEV_LOG',
  'AI 정보': 'AI',
  '연예 이슈': 'ENTERTAINMENT',
  '채용·공채': 'CAREER',
  '주식·코인': 'FINANCE',
  부동산: 'REAL_ESTATE',
};
export function normalizePostCategory(code: string) {
  return (
    legacy[code] ??
    defaultPostCategories.find((c) => c.nameKo === code)?.code ??
    code
  );
}

export function postCategoryLabel(
  category: string,
  locale: 'ko' | 'en',
  options: PostCategory[] = defaultPostCategories,
) {
  if (category === '전체') return locale === 'en' ? 'All' : '전체';
  const code = normalizePostCategory(category);
  const found = options.find((c) => c.code === code);
  const fallback = defaultPostCategories.find((c) => c.code === code);
  const key = locale === 'en' ? 'nameEn' : 'nameKo';
  return (
    found?.[key]?.trim() ||
    fallback?.[key] ||
    (locale === 'en' ? 'Other' : '기타')
  );
}
