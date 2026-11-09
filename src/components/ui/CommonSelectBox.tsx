'use client';

import { Select } from '@mantine/core';
import s from './CommonSelectBox.module.css';

export type CommonSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function CommonSelectBox({
  value,
  onValueChange,
  options,
  disabled,
  required,
  name,
  id,
  className = '',
  ...aria
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: CommonSelectOption[];
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** 관리자 화면 공통 입력 스타일에서 빼야 하는 에디터 도구 막대 입력에 붙인다. */
  'data-editor-control'?: boolean;
}) {
  const encode = (item: string) => (item === '' ? '__oz_empty__' : item);

  return (
    <Select
      value={encode(value)}
      onChange={(next) =>
        onValueChange(next === '__oz_empty__' ? '' : (next ?? ''))
      }
      data={options.map((option) => ({
        ...option,
        value: encode(option.value),
      }))}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      checkIconPosition="right"
      comboboxProps={{ withinPortal: true, zIndex: 300 }}
      classNames={{
        root: s.root,
        input: `${s.trigger} ${className}`,
        dropdown: s.content,
        options: s.viewport,
        option: s.item,
      }}
      {...aria}
    />
  );
}
