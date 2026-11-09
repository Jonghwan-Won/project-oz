import Image from 'next/image';
import { CommonRichTextView } from './ui/CommonRichTextView';
import { CommonAssetLinks } from './ui/CommonAssetLinks';
import { ProjectTag } from './ProjectTag';
import type { ProjectDetailData } from '@/lib/project-detail';
import { sharedCopy } from '@/i18n/shared-copy';
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
  const copy = sharedCopy(locale).projectDetail;
  const Heading = heading;
  const rows = [
    { label: copy.period, value: project.period || '-' },
    { label: copy.client, value: project.customerName || '-' },
    { label: copy.origin, value: project.originLabel || '-' },
    { label: copy.type, value: project.typeLabel || '-' },
  ];
  return (
    <article className={s.detail}>
      <div className={s.document}>
        <Heading className={s.title} lang={project.contentLocale}>
          {project.title || copy.untitled}
        </Heading>
        {project.technologies.length > 0 && (
          <div className={s.technologies} aria-label={copy.technologies}>
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
          <p role="status">{copy.fallbackNotice}</p>
        )}
        <div className={s.content} lang={project.contentLocale}>
          <CommonRichTextView value={project.body} />
        </div>
        {project.attachments.length > 0 && (
          <section>
            <h3>{copy.attachments}</h3>
            <CommonAssetLinks
              assets={project.attachments}
              disabled={downloadsDisabled}
            />
          </section>
        )}
        {project.tags.length > 0 && (
          <section>
            <h3>{copy.tags}</h3>
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
