import Link from 'next/link';
import s from './MainPageLink.module.css';

export function MainPageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={s.link}>
      <svg
        className={s.icon}
        viewBox="0 0 20 20"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m13.5 3.5-6.5 6.5 6.5 6.5" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
