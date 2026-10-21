import Link from 'next/link';
import Image from 'next/image';
import type { Project } from '@/content/projects';
import type { Messages } from '@/i18n/ko';
import s from './ProjectCard.module.css';

export function ProjectCard({
  project,
  labels,
}: {
  project: Project;
  labels: Messages;
}) {
  const item = labels.projectItems[project.slug];
  return (
    <Link
      className={`interactiveCard ${s.card}`}
      href={`/work/${project.slug}`}
    >
      <div className={s.cover} aria-hidden="true">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            className={s.image}
          />
        ) : (
          <>
            <span className={s.index}>
              {String(project.order).padStart(2, '0')} /{' '}
              {labels.projectOrigins[project.origin]}
            </span>
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
            <strong className={s.coverTitle}>{item.title}</strong>
            <span className={s.preview}>{labels.projects.preview}</span>
          </>
        )}
      </div>
      <div className={s.details}>
        <div className={s.heading}>
          <h3>{item.title}</h3>
          <span aria-hidden="true">↗</span>
        </div>
        <div className={s.meta}>
          <span>{labels.projectOrigins[project.origin]}</span>
          {project.type && <span>{labels.projectTypes[project.type]}</span>}
          {project.lifecycle && (
            <span>{labels.projectStatuses[project.lifecycle]}</span>
          )}
          {project.placeholder && <span>{labels.projects.placeholder}</span>}
        </div>
      </div>
    </Link>
  );
}
