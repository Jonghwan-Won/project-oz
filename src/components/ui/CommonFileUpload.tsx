'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CommonFilePicker } from './CommonFilePicker';
import { CommonLoading } from './CommonLoading';
import s from './CommonFileUpload.module.css';
import { maxUploadBytes, type UploadedAsset } from '@/lib/files';
import { uploadFile } from '@/lib/upload-file';

export const defaultFileUploadLabels = {
  uploading: '업로드 중…',
  duplicate: '같은 이름의 파일이 이미 첨부되어 있습니다.',
  tooLarge: '파일은 10MB 이하여야 합니다.',
  imagesOnly: 'PNG·JPEG·WebP 이미지를 선택해 주세요.',
  uploadingStatus: 'NAS에 업로드하고 있어요.',
  failed: '업로드에 실패했습니다.',
  hint: '최대 10MB · PNG, JPEG, WebP',
  hintPdf: ' · PDF',
};
export type FileUploadLabels = typeof defaultFileUploadLabels;
export function CommonFileUpload({
  label,
  disabled = false,
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
  labels = defaultFileUploadLabels,
}: {
  label: string;
  disabled?: boolean;
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
  labels?: FileUploadLabels;
}) {
  const id = useId();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <div className={compact && !bare ? s.withFiles : bare ? s.bare : undefined}>
      <CommonFilePicker
        label={busy ? labels.uploading : label}
        compact={compact}
        native={native}
        icon={icon}
        disabled={disabled || busy}
        accept={
          imagesOnly
            ? 'image/png,image/jpeg,image/webp'
            : 'image/png,image/jpeg,image/webp,application/pdf'
        }
        aria-describedby={id}
        onSelect={async (file) => {
          if (disabled) return;
          const normalize = (name: string) =>
            name.normalize('NFKC').toLocaleLowerCase();
          if (
            duplicateNames.some(
              (name) => normalize(name) === normalize(file.name),
            )
          ) {
            setMessage(labels.duplicate);
            return;
          }
          if (file.size > maxUploadBytes) {
            setMessage(labels.tooLarge);
            return;
          }
          if (
            imagesOnly &&
            !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
          ) {
            setMessage(labels.imagesOnly);
            return;
          }
          setBusy(true);
          onBusyChange?.(true);
          setMessage(labels.uploadingStatus);
          controller.current = new AbortController();
          const signal = controller.current.signal;
          try {
            const result = await uploadFile(file, signal);
            if (signal.aborted) return;
            onUploaded(result);
            setMessage('');
          } catch (error) {
            if (!signal.aborted)
              setMessage(
                error instanceof Error ? error.message : labels.failed,
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
        {message || labels.hint + (imagesOnly ? '' : labels.hintPdf)}
      </small>
      <CommonLoading open={busy} />
    </div>
  );
}
