'use client';
import { useId, useRef, useState } from 'react';
import { CommonButton } from './CommonButton';
import s from './CommonFilePicker.module.css';
export function CommonFilePicker({
  label,
  accept,
  disabled = false,
  compact = false,
  onSelect,
  'aria-describedby': description,
}: {
  label: string;
  accept?: string;
  disabled?: boolean;
  compact?: boolean;
  onSelect: (file: File) => void;
  'aria-describedby'?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  return (
    <div className={compact ? s.compact : s.field}>
      <span className={compact ? 'srOnly' : s.label} id={id + '-label'}>
        {label}
      </span>
      <div className={compact ? s.compact : s.picker}>
        <CommonButton
          size="sm"
          disabled={disabled}
          aria-label={label + ' 파일 선택'}
          aria-describedby={description}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => input.current?.click()}
        >
          {compact ? label : '파일 선택'}
        </CommonButton>
        {!compact && (
          <span className={s.filename} title={name}>
            {name || '선택된 파일 없음'}
          </span>
        )}
      </div>
      <input
        ref={input}
        id={id}
        hidden
        type="file"
        accept={accept}
        disabled={disabled}
        aria-labelledby={id + '-label'}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          setName(file.name);
          onSelect(file);
        }}
      />
    </div>
  );
}
