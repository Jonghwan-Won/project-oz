import type { ComponentProps } from 'react';
import { Checkbox, Radio, TextInput } from '@mantine/core';
import s from './CommonFormControl.module.css';
export function CommonInput({
  className = '',
  type = 'text',
  ...props
}: Omit<ComponentProps<'input'>, 'size'>) {
  if (type === 'hidden')
    return <input {...props} type={type} className={className} />;
  if (type === 'checkbox') return <Checkbox {...props} className={className} />;
  if (type === 'radio') return <Radio {...props} className={className} />;
  return (
    <TextInput
      {...props}
      type={type}
      classNames={{ root: s.root, input: `${s.control} ${className}` }}
    />
  );
}
