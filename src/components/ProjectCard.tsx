import { ProjectPreviewLink } from './ProjectPreviewLink';
import { ProjectTag } from './ProjectTag';
import { formatProjectPeriod, publicProjectDetail } from '@/lib/project-detail';
import Image from 'next/image';
import type { PublicProject } from '@/server/services/projects';
import s from './ProjectCard.module.css';

export function ProjectCard({
  project,
  locale = 'ko',
}: {
  project: PublicProject;
  locale?: string;
}) {
  const en = locale === 'en';
  const technologies = project.tags.filter((tag) => tag.kind === 'TECHNOLOGY');
  const context = [
    project.customerName || project.originLabel,
    project.typeLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <ProjectPreviewLink
      project={publicProjectDetail(project, locale)}
      locale={locale}
      className={`interactiveCard ${s.card}`}
      href={`/work/${project.slug}`}
    >
      <div className={s.cover} aria-hidden="true">
        {project.thumbnail ? (
          <Image
            unoptimized
            src={project.thumbnail}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            className={s.image}
          />
        ) : (
          <>
            <svg className={s.art} viewBox="0 0 600 400" fill="none">
              <circle cx="300" cy="200" r="132" />
              <ellipse
                cx="300"
                cy="200"
                rx="132"
                ry="48"
                transform="rotate(-32 300 200)"
              />
              <ellipse
                cx="300"
                cy="200"
                rx="50"
                ry="132"
                transform="rotate(-32 300 200)"
              />
              <path d="M38 200h524M300 32v336" strokeDasharray="3 9" />
            </svg>
            {/* 이미지 준비 중 */}
            {/* <span className={s.preview}>{labels.projects.preview}</span> */}
          </>
        )}
      </div>
      <div className={s.details}>
        <div className={s.heading}>
          <h3>{project.title}</h3>
        </div>
        <div className={s.meta}>
          {context && <div className={s.metaLine}>{context}</div>}
          <div className={s.metaLine}>
            {project.startedOn && (
              <span className={s.period}>
                {formatProjectPeriod(
                  project.startedOn,
                  project.endedOn,
                  locale,
                )}
              </span>
            )}
          </div>
          {technologies.length > 0 && (
            <div
              className={s.technologies}
              role="list"
              aria-label={en ? 'Representative technologies' : '대표 기술'}
            >
              {technologies.slice(0, 3).map((tag) => (
                <ProjectTag
                  label={tag.name}
                  className={s.technology}
                  role="listitem"
                  key={tag.name}
                />
              ))}
              {technologies.length > 3 && (
                <ProjectTag
                  label={`+${technologies.length - 3}`}
                  className={s.technology}
                  role="listitem"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </ProjectPreviewLink>
  );
}
