import type { JSONContent } from '@tiptap/core';
import { parseRichText, textDocument } from './rich-text';
import type { UploadedAsset } from './files';
import { thumbnailUrl } from './files';
export type ProjectCopy = { title: string; summary: string; body: JSONContent };
export type ProjectForm = {
  customerName: string;
  startedOn: string;
  endedOn: string;
  updatedAt?: string;
  id: string;
  version: number;
  slug: string;
  originCode: string;
  typeCode: string;
  lifecycle: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  position: number;
  placeholder: boolean;
  thumbnail: string;
  technologies: string[];
  tags: string[];
  attachmentIds: string[];
  files?: UploadedAsset[];
  translations: { ko: ProjectCopy; en: ProjectCopy };
};
export type ProjectCode = {
  groupKey: string;
  code: string;
  nameKo: string;
  isActive: boolean;
};
export const blankCopy = (): ProjectCopy => ({
  title: '',
  summary: '',
  body: textDocument(''),
});
export const blankProject = (): ProjectForm => ({
  customerName: '',
  startedOn: '',
  endedOn: '',
  id: '',
  version: 0,
  slug: '',
  originCode: 'personal',
  typeCode: '',
  lifecycle: 'BUILDING',
  visibility: 'PRIVATE',
  position: 0,
  placeholder: false,
  thumbnail: '',
  technologies: [],
  tags: [],
  attachmentIds: [],
  translations: { ko: blankCopy(), en: blankCopy() },
});
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export const uuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function parseProjectForm(value: unknown): ProjectForm {
  if (!record(value)) throw Error('프로젝트 입력을 확인해 주세요.');
  const string = (key: string, max: number) => {
    const v = value[key];
    if (typeof v !== 'string' || v.length > max)
      throw Error(key + ' 입력을 확인해 주세요.');
    return v.trim();
  };
  const list = (key: string) => {
    const v = value[key];
    if (
      !Array.isArray(v) ||
      v.length > 30 ||
      !v.every((s: unknown) => typeof s === 'string' && s.length <= 100)
    )
      throw Error(key + ' 목록을 확인해 주세요.');
    return [...new Set(v.map((s: string) => s.trim()).filter(Boolean))];
  };
  const id = string('id', 36),
    slug = string('slug', 80),
    thumbnail = string('thumbnail', 2048);
  if (
    (id && !uuid(id)) ||
    !/^([a-z0-9]+-)*[a-z0-9]+$/.test(slug) ||
    !thumbnailUrl(thumbnail)
  )
    throw Error('주소 또는 썸네일 URL을 확인해 주세요.');
  const visibility = value.visibility;
  if (visibility !== 'PRIVATE' && visibility !== 'PUBLIC')
    throw Error('공개 범위를 확인해 주세요.');
  const lifecycle = string('lifecycle', 20);
  if (
    !['', 'IDEA', 'BUILDING', 'TESTING', 'RELEASED', 'ARCHIVED'].includes(
      lifecycle,
    )
  )
    throw Error('진행 상태를 확인해 주세요.');
  const date = (key: string) => {
    const v = value[key];
    if (v === undefined || v === '') return '';
    if (
      typeof v !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      !Number.isFinite(Date.parse(v + 'T00:00:00Z')) ||
      new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) !== v
    )
      throw Error('프로젝트 기간을 확인해 주세요.');
    return v;
  };
  const startedOn = date('startedOn');
  const endedOn = date('endedOn');
  if (endedOn && !startedOn) throw Error('시작일을 먼저 입력해 주세요.');
  if (startedOn && endedOn && endedOn < startedOn)
    throw Error('종료일은 시작일보다 빠를 수 없습니다.');
  if (
    typeof value.version !== 'number' ||
    !Number.isSafeInteger(value.version) ||
    value.version < 0 ||
    typeof value.position !== 'number' ||
    !Number.isSafeInteger(value.position) ||
    value.position < 0 ||
    value.position > 100000 ||
    typeof value.placeholder !== 'boolean'
  )
    throw Error('순서·버전을 확인해 주세요.');
  const translations = value.translations;
  if (!record(translations)) throw Error('언어별 내용을 확인해 주세요.');
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
  const attachmentIds = list('attachmentIds');
  if (!attachmentIds.every(uuid)) throw Error('첨부파일을 확인해 주세요.');
  return {
    id,
    customerName:
      value.customerName === undefined ? '' : string('customerName', 200),
    startedOn,
    endedOn,
    version: value.version,
    slug,
    originCode: string('originCode', 60),
    typeCode: string('typeCode', 60),
    lifecycle,
    visibility,
    position: value.position,
    placeholder: value.placeholder,
    thumbnail,
    technologies: list('technologies'),
    tags: list('tags'),
    attachmentIds,
    translations: { ko, en },
  };
}
export function inlineAssetIds(body: JSONContent): string[] {
  return [
    ...new Set(
      (body.type === 'image' && typeof body.attrs?.src === 'string'
        ? [body.attrs.src.slice('/api/assets/'.length)]
        : []
      ).concat((body.content ?? []).flatMap(inlineAssetIds)),
    ),
  ];
}
