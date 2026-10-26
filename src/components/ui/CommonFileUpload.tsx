'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CommonFilePicker } from './CommonFilePicker';
import { CommonLoading } from './CommonLoading';
import s from './CommonFileUpload.module.css';
import {
  isUploadedAsset,
  maxUploadBytes,
  type UploadedAsset,
} from '@/lib/files';
export function CommonFileUpload({
  label,
  imagesOnly = false,
  duplicateNames = [],
  compact = false,
  bare = false,
  native = false,
  hideHint = false,
  icon,
  children,
  onUploaded,
  onBusyChange,
}: {
  label: string;
  imagesOnly?: boolean;
  duplicateNames?: string[];
  compact?: boolean;
  bare?: boolean;
  native?: boolean;
  hideHint?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  onUploaded: (asset: UploadedAsset) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const id = useId();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <div className={compact && !bare ? s.withFiles : bare ? s.bare : undefined}>
      <CommonFilePicker
        label={busy ? '업로드 중…' : label}
        compact={compact}
        native={native}
        icon={icon}
        disabled={busy}
        accept={
          imagesOnly
            ? 'image/png,image/jpeg,image/webp'
            : 'image/png,image/jpeg,image/webp,application/pdf'
        }
        aria-describedby={id}
        onSelect={async (file) => {
          const normalize = (name: string) =>
            name.normalize('NFKC').toLocaleLowerCase();
          if (
            duplicateNames.some(
              (name) => normalize(name) === normalize(file.name),
            )
          ) {
            setMessage('같은 이름의 파일이 이미 첨부되어 있습니다.');
            return;
          }
          if (file.size > maxUploadBytes) {
            setMessage('파일은 10MB 이하여야 합니다.');
            return;
          }
          if (
            imagesOnly &&
            !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
          ) {
            setMessage('PNG·JPEG·WebP 이미지를 선택해 주세요.');
            return;
          }
          setBusy(true);
          onBusyChange?.(true);
          setMessage('NAS에 업로드하고 있어요.');
          controller.current = new AbortController();
          const signal = controller.current.signal;
          try {
            const form = new FormData();
            form.set('file', file);
            const response = await fetch('/api/assets', {
              method: 'POST',
              signal,
              body: form,
            });
            const result: unknown = await response.json();
            if (!response.ok || !isUploadedAsset(result))
              throw Error(
                result &&
                  typeof result === 'object' &&
                  'message' in result &&
                  typeof result.message === 'string'
                  ? result.message
                  : '업로드에 실패했습니다.',
              );
            if (signal.aborted) return;
            onUploaded(result);
            setMessage('');
          } catch (error) {
            if (!signal.aborted)
              setMessage(
                error instanceof Error
                  ? error.message
                  : '업로드에 실패했습니다.',
              );
          } finally {
            setBusy(false);
            onBusyChange?.(false);
          }
        }}
      />
      {children}
      <small
        id={id}
        role="status"
        className={(compact || hideHint) && !message ? 'srOnly' : undefined}
      >
        {message ||
          '최대 10MB · PNG, JPEG, WebP' + (imagesOnly ? '' : ' · PDF')}
      </small>
      <CommonLoading open={busy} />
    </div>
  );
}
