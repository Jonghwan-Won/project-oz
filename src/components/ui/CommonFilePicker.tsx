'use client';
import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CommonButton } from './CommonButton';
import s from './CommonFilePicker.module.css';

export const defaultFilePickerLabels = {
  choose: '파일 선택',
  chooseFor: '{label} 파일 선택',
  none: '선택된 파일 없음',
};
export type FilePickerLabels = typeof defaultFilePickerLabels;
export function CommonFilePicker({
  label,
  accept,
  disabled = false,
  compact = false,
  native = false,
  icon,
  onSelect,
  'aria-describedby': description,
  labels = defaultFilePickerLabels,
}: {
  label: string;
  accept?: string;
  disabled?: boolean;
  compact?: boolean;
  native?: boolean;
  icon?: ReactNode;
  onSelect: (file: File) => void;
  'aria-describedby'?: string;
  labels?: FilePickerLabels;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  return (
    <div className={native ? s.nativePicker : compact ? s.compact : s.field}>
      <span
        className={compact || native ? 'srOnly' : s.label}
        id={id + '-label'}
      >
        {label}
      </span>
      {!native && (
        <div className={compact ? s.compact : s.picker}>
          <CommonButton
            size="sm"
            disabled={disabled}
            aria-label={
              compact ? label : labels.chooseFor.replace('{label}', label)
            }
            aria-describedby={description}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => input.current?.click()}
          >
            {icon ?? (compact ? label : labels.choose)}
          </CommonButton>
          {!compact && (
            <span className={s.filename} title={name}>
              {name || labels.none}
            </span>
          )}
        </div>
      )}
      <input
        ref={input}
        id={id}
        hidden={!native}
        className={native ? s.native : undefined}
        type="file"
        accept={accept}
        disabled={disabled}
        aria-labelledby={id + '-label'}
        aria-describedby={description}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          if (!native) setName(file.name);
          onSelect(file);
        }}
      />
    </div>
  );
}
