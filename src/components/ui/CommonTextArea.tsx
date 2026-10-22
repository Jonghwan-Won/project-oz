import type { ComponentProps } from 'react';
import { Textarea } from '@mantine/core';
import s from './CommonFormControl.module.css';
export function CommonTextArea({
  className = '',
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <Textarea
      {...props}
      classNames={{
        root: s.root,
        input: `${s.control} ${s.textarea} ${className}`,
      }}
    />
  );
}
