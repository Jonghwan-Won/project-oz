import type { ComponentProps } from 'react';
import s from './FormControl.module.css';
export function TextArea({
  className = '',
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={s.control + ' ' + s.textarea + ' ' + className}
    />
  );
}
