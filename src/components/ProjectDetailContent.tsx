import Image from 'next/image';
import { CommonRichTextView } from './ui/CommonRichTextView';
import { CommonAssetLinks } from './ui/CommonAssetLinks';
import { ProjectTag } from './ProjectTag';
import type { ProjectDetailData } from '@/lib/project-detail';
import s from './ProjectDetailContent.module.css';

export function ProjectDetailContent({
  project,
  locale = 'ko',
  heading = 'h2',
  downloadsDisabled = false,
}: {
  project: ProjectDetailData;
  locale?: string;
  heading?: 'h1' | 'h2';
  downloadsDisabled?: boolean;
}) {
  const en = locale === 'en';
  const Heading = heading;
  const rows = [
    { label: en ? 'Period' : '작업 기간', value: project.period || '-' },
    { label: en ? 'Client' : '고객사', value: project.customerName || '-' },
    { label: en ? 'Origin' : '작업 구분', value: project.originLabel || '-' },
    { label: en ? 'Type' : '프로젝트 유형', value: project.typeLabel || '-' },
  ];
  return (
    <article className={s.detail}>
      <div className={s.document}>
        <Heading className={s.title} lang={project.contentLocale}>
          {project.title || (en ? 'Untitled project' : '제목 없는 프로젝트')}
        </Heading>
        {project.technologies.length > 0 && (
          <div
            className={s.technologies}
            aria-label={en ? 'Technologies' : '사용 기술'}
          >
            {project.technologies.map((value) => (
              <ProjectTag label={value} key={value} />
            ))}
          </div>
        )}
        <dl className={s.properties}>
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {project.summary && (
          <p className={s.summary} lang={project.contentLocale}>
            {project.summary}
          </p>
        )}
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
        {locale !== project.contentLocale && (
          <p role="status">
            English translation is being prepared. Showing the Korean original.
          </p>
        )}
        <div className={s.content} lang={project.contentLocale}>
          <CommonRichTextView value={project.body} />
        </div>
        {project.attachments.length > 0 && (
          <section>
            <h3>{en ? 'Attachments' : '첨부파일'}</h3>
            <CommonAssetLinks
              assets={project.attachments}
              disabled={downloadsDisabled}
            />
          </section>
        )}
        {project.tags.length > 0 && (
          <section>
            <h3>{en ? 'Tags' : '태그'}</h3>
            <div className={s.technologies}>
              {project.tags.map((value) => (
                <ProjectTag label={value} key={value} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
