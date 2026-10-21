'use client';

import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';
import s from './OzAlert.module.css';

export function OzAlert({
  open,
  onClose,
  content,
  confirmLabel = '확인',
  variant = 'default',
  width = 360,
}: {
  open: boolean;
  onClose: () => void;
  content: string;
  confirmLabel?: string;
  variant?: 'default' | 'error';
  width?: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={s.alert}
      data-variant={variant}
      style={{ width }}
      role="alertdialog"
      aria-label={variant === 'error' ? '오류 알림' : '알림'}
      aria-describedby={`${id}-content`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={s.content}>
        {/* <span className={s.icon} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d={
                variant === 'error' ? 'M6 6l12 12M18 6L6 18' : 'M5 12l4 4L19 6'
              }
            />
          </svg>
        </span> */}
        <p id={`${id}-content`} className={s.message}>
          {content}
        </p>
        <div className={s.actions}>
          <Button variant="neutral" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
