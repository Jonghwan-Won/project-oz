'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { CommonModal } from './ui/CommonModal';
import { CommonButton } from './ui/CommonButton';
import { CommonLoading } from './ui/CommonLoading';
import { ProjectDetailContent } from './ProjectDetailContent';
import s from './ProjectDetailContent.module.css';
import type { ProjectDetailData } from '@/lib/project-detail';
export function ProjectPreviewLink({
  href,
  className,
  projectId,
  locale,
  children,
}: {
  href: string;
  className: string;
  projectId: string;
  locale: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function openDetails() {
    setLoading(true);
    setProject(null);
    setError('');
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('프로젝트 상세를 불러오지 못했습니다.');
      setProject(await response.json());
      setOpen(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '프로젝트 상세를 불러오지 못했습니다.',
      );
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(event) => {
          if (
            event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            void openDetails();
          }
        }}
      >
        {children}
      </Link>
      <CommonLoading open={loading} />
      {open && (
        <CommonModal
          open
          fillHeight
          title={locale === 'en' ? 'Project details' : '프로젝트 상세'}
          onClose={() => setOpen(false)}
          actions={
            <CommonButton size="sm" onClick={() => setOpen(false)}>
              {locale === 'en' ? 'Close' : '닫기'}
            </CommonButton>
          }
        >
          {error ? (
            <p role="alert">{error}</p>
          ) : project ? (
            <ProjectDetailContent project={project} locale={locale} />
          ) : (
            <div className={s.detail} aria-hidden="true" />
          )}
        </CommonModal>
      )}
    </>
  );
}
