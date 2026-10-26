'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { Button } from '@mantine/core';
import s from './CommonButton.module.css';

type StyleProps = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'neutral' | 'primary' | 'ghost';
};
type CommonButtonProps = StyleProps & ComponentProps<'button'>;
type CommonButtonLinkProps = StyleProps & ComponentProps<typeof Link>;
function styles(
  { size = 'md', variant = 'neutral' }: StyleProps,
  className = '',
) {
  return [s.button, s[size], s[variant], className].filter(Boolean).join(' ');
}
export function CommonButton({
  size,
  variant,
  className,
  type = 'button',
  ...props
}: CommonButtonProps) {
  return (
    <Button
      {...props}
      unstyled
      type={type}
      className={styles({ size, variant }, className)}
      data-variant={variant ?? 'neutral'}
    />
  );
}
export function CommonButtonLink({
  size,
  variant,
  className,
  ...props
}: CommonButtonLinkProps) {
  return (
    <Button
      component={Link}
      unstyled
      {...props}
      className={styles({ size, variant }, className)}
      data-variant={variant ?? 'neutral'}
    />
  );
}
