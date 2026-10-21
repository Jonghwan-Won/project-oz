'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ProjectDetailContent } from './ProjectDetailContent';
import type { ProjectDetailData } from '@/lib/project-detail';
export function ProjectPreviewLink({
  href,
  className,
  project,
  locale,
  children,
}: {
  href: string;
  className: string;
  project: ProjectDetailData;
  locale: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
            setOpen(true);
          }
        }}
      >
        {children}
      </Link>
      {open && (
        <Modal
          open
          title={locale === 'en' ? 'Project details' : '프로젝트 상세'}
          onClose={() => setOpen(false)}
          actions={
            <Button onClick={() => setOpen(false)}>
              {locale === 'en' ? 'Close' : '닫기'}
            </Button>
          }
        >
          <ProjectDetailContent project={project} locale={locale} />
        </Modal>
      )}
    </>
  );
}
