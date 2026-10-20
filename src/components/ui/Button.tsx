import Link from 'next/link';
import type { ComponentProps } from 'react';
import s from './Button.module.css';

type StyleProps = { size?: 'sm' | 'md' | 'lg'; variant?: 'neutral' | 'primary' | 'ghost' };
type ButtonProps = StyleProps & ComponentProps<'button'>;
type ButtonLinkProps = StyleProps & ComponentProps<typeof Link>;
function styles({ size = 'md', variant = 'neutral' }: StyleProps, className = '') {
  return [s.button, s[size], s[variant], className].filter(Boolean).join(' ');
}
export function Button({ size, variant, className, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} className={styles({ size, variant }, className)}/>;
}
export function ButtonLink({ size, variant, className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={styles({ size, variant }, className)}/>;
}
