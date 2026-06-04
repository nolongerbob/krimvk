'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  BVI_TRIGGER_ID,
  isInternalNavigationLink,
  reapplyBviAfterNavigation,
  teardownBviBeforeNavigation,
} from '@/lib/bvi-loader';
import { bindBviPanelSpeechPriming } from '@/lib/bvi-speech-patch';

/**
 * Синхронизация BVI с клиентской навигацией Next.js (плагин рассчитан на полную перезагрузку страницы).
 */
export function BviRouteSync() {
  const pathname = usePathname();

  useEffect(() => bindBviPanelSpeechPriming(), []);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigationLink(anchor)) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      teardownBviBeforeNavigation();
    };

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reapplyBviAfterNavigation();
    }, 0);
    return () => {
      window.clearTimeout(id);
      teardownBviBeforeNavigation();
    };
  }, [pathname]);

  return (
    <a
      id={BVI_TRIGGER_ID}
      href="#"
      className="bvi-open pointer-events-none absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
      style={{ clip: 'rect(0,0,0,0)' }}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
