import type { ComponentProps } from 'react';
import s from './FormControl.module.css';
export function Input({
  className = '',
  type = 'text',
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      type={type}
      className={[
        type === 'checkbox' || type === 'radio' ? s.check : s.control,
        className,
      ].join(' ')}
    />
  );
}
