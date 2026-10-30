import { blankCopy, uuid, type ProjectCopy } from './project-form';
import { parseRichText } from './rich-text';

export type PostForm = {
  id: string;
  version: number;
  slug: string;
  category: string;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
  translations: { ko: ProjectCopy; en: ProjectCopy };
};
export type PostListItem = Omit<PostForm, 'translations'> & {
  translations: {
    ko: { title: string; summary: string };
    en: { title: string; summary: string };
  };
};
export const blankPost = (): PostForm => ({
  id: '',
  version: 0,
  slug: '',
  category: 'DEV_LOG',
  isVisible: false,
  translations: { ko: blankCopy(), en: blankCopy() },
});
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

export function parsePostForm(value: unknown): PostForm {
  if (!record(value)) throw Error('게시글 입력을 확인해 주세요.');
  const { id, version, slug, category, isVisible, translations } = value;
  if (
    typeof id !== 'string' ||
    (id !== '' && !uuid(id)) ||
    typeof version !== 'number' ||
    !Number.isSafeInteger(version) ||
    version < 0 ||
    (id !== '' && version < 1) ||
    typeof slug !== 'string' ||
    slug.length > 80 ||
    (slug !== '' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) ||
    (id !== '' && !slug) ||
    typeof category !== 'string' ||
    !/^[A-Z][A-Z0-9_]{0,39}$/.test(category) ||
    typeof isVisible !== 'boolean' ||
    !record(translations)
  )
    throw Error('게시글 정보·카테고리·노출 여부를 확인해 주세요.');
  const copy = (locale: string): ProjectCopy => {
    const v = translations[locale];
    if (
      !record(v) ||
      typeof v.title !== 'string' ||
      v.title.length > 200 ||
      typeof v.summary !== 'string' ||
      v.summary.length > 4000
    )
      throw Error('제목·요약을 확인해 주세요.');
    const body = parseRichText(v.body);
    if (!body) throw Error('지원하지 않는 본문 형식입니다.');
    return { title: v.title.trim(), summary: v.summary.trim(), body };
  };
  const ko = copy('ko'),
    en = copy('en');
  if (!ko.title) throw Error('한국어 제목을 입력해 주세요.');
  return { id, version, slug, category, isVisible, translations: { ko, en } };
}
