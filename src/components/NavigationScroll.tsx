'use client';
import { useLayoutEffect, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Link navigations reset; browser back/forward keeps native restoration.
export function NavigationScroll() {
  const pathname = usePathname();
  const destination = useRef<string | null>(null);
  useEffect(() => {
    const remember = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === '/' && window.location.pathname === '/' && !url.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      destination.current = url.origin === window.location.origin && !url.hash && url.pathname !== window.location.pathname ? url.pathname : null;
    };
    document.addEventListener('click', remember, true);
    return () => document.removeEventListener('click', remember, true);
  }, []);
  useLayoutEffect(() => {
    if (destination.current === pathname && !window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    destination.current = null;
  }, [pathname]);
  return null;
}
