'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  BVI_TRIGGER_ID,
  isBviEnabledInCookies,
  isBviPanelActive,
  reapplyBviAfterNavigation,
  refreshBviAfterClientNavigation,
} from '@/lib/bvi-loader';
import { bindBviPanelSpeechPriming } from '@/lib/bvi-speech-patch';

/**
 * Синхронизация BVI с клиентской навигацией Next.js.
 * Не снимаем обёртку .bvi-body при переходах — иначе React падает с NotFoundError.
 */
export function BviRouteSync() {
  const pathname = usePathname();

  useEffect(() => bindBviPanelSpeechPriming(), []);

  useEffect(() => {
    let cancelled = false;
    let outerRaf = 0;
    let innerRaf = 0;

    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (cancelled) return;

        if (isBviPanelActive()) {
          refreshBviAfterClientNavigation();
          return;
        }

        if (isBviEnabledInCookies()) {
          void reapplyBviAfterNavigation();
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
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
