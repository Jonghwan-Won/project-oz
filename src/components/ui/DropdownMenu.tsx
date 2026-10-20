'use client';

import * as Primitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';
import s from './DropdownMenu.module.css';

export { Root, Trigger, RadioGroup } from '@radix-ui/react-dropdown-menu';

export function Content({
  children,
  className = '',
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align="end"
        sideOffset={10}
        collisionPadding={12}
        {...props}
        className={`${s.content} ${className}`}
      >
        {children}
        <Primitive.Arrow className={s.arrow} width={12} height={6} />
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function RadioItem({
  children,
  className = '',
  ...props
}: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem {...props} className={`${s.item} ${className}`}>
      {children}
      <Primitive.ItemIndicator className={s.indicator}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </Primitive.ItemIndicator>
    </Primitive.RadioItem>
  );
}
