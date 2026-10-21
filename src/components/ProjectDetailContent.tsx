import Image from 'next/image';
import { RichTextView } from './ui/RichTextView';
import { AssetLinks } from './ui/AssetLinks';
import type { ProjectDetailData } from '@/lib/project-detail';
import s from './ProjectDetailContent.module.css';

export function ProjectDetailContent({
  project,
  locale = 'ko',
  heading = 'h2',
}: {
  project: ProjectDetailData;
  locale?: string;
  heading?: 'h1' | 'h2';
}) {
  const en = locale === 'en';
  const Heading = heading;
  const rows = [
    { label: en ? 'Client' : '고객사', value: project.customerName },
    { label: en ? 'Origin' : '작업 구분', value: project.originLabel },
    { label: en ? 'Type' : '유형', value: project.typeLabel },
    { label: en ? 'Status' : '진행 상태', value: project.statusLabel },
    { label: en ? 'Technologies' : '사용 기술', value: project.technologies },
    { label: en ? 'Tags' : '태그', value: project.tags },
  ];
  return (
    <article className={s.detail}>
      {project.thumbnail && (
        <div className={s.cover}>
          <Image
            unoptimized
            src={project.thumbnail}
            alt=""
            width={1200}
            height={500}
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <div className={s.document}>
        <Heading className={s.title} lang={project.contentLocale}>
          {project.title || (en ? 'Untitled project' : '제목 없는 프로젝트')}
        </Heading>
        <dl className={s.properties}>
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {Array.isArray(row.value)
                  ? row.value.length
                    ? row.value.map((value) => (
                        <span className={s.tag} key={value}>
                          {value}
                        </span>
                      ))
                    : '—'
                  : row.value || '—'}
              </dd>
            </div>
          ))}
        </dl>
        {project.placeholder && (
          <p className={s.notice}>
            {en
              ? 'Placeholder project. Details are being prepared.'
              : '배치 확인용 임시 데이터입니다. 상세 내용을 준비 중입니다.'}
          </p>
        )}
        {locale !== project.contentLocale && (
          <p role="status">
            English translation is being prepared. Showing the Korean original.
          </p>
        )}
        {project.summary && (
          <p className={s.summary} lang={project.contentLocale}>
            {project.summary}
          </p>
        )}
        <div className={s.content} lang={project.contentLocale}>
          <RichTextView value={project.body} />
        </div>
        {project.attachments.length > 0 && (
          <section>
            <h3>{en ? 'Attachments' : '첨부파일'}</h3>
            <AssetLinks assets={project.attachments} />
          </section>
        )}
      </div>
    </article>
  );
}
