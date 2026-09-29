'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { LoadingVisual } from './Loading';
import { usePathname } from 'next/navigation';

export const PageLoadingContext = createContext<(() => () => void) | null>(null);

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Render the initial home overlay on the server too, including cached HTML.
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'fading'>(pathname === '/' ? 'visible' : 'hidden');
  const pending = useRef(new Set<symbol>());
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const clearTimer = useCallback(() => clearTimeout(timer.current), []);

  const register = useCallback(() => {
    clearTimer();
    if (!pending.current.size) started.current = Date.now();
    const token = Symbol();
    pending.current.add(token);
    setPhase('visible');
    return () => {
      if (!pending.current.delete(token) || pending.current.size) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const remaining = reduced ? 0 : Math.max(0, 1400 - (Date.now() - started.current));
      timer.current = setTimeout(() => {
        setPhase('fading');
        timer.current = setTimeout(() => setPhase('hidden'), reduced ? 0 : 650);
      }, remaining);
    };
  }, [clearTimer]);

  useEffect(() => {
    if (pathname !== '/') return;
    const release = register();
    let disposed = false;
    let firstFrame = 0, secondFrame = 0;
    // Wait for above-the-fold assets, not every image/map on this long page.
    const hero = document.querySelector<HTMLImageElement>('[data-seasonal-hero] img');
    const assets = Promise.allSettled([
      document.fonts?.ready ?? Promise.resolve(),
      hero?.decode?.() ?? Promise.resolve(),
    ]);
    let finished = false;
    const finish = () => {
      if (disposed || finished) return;
      finished = true;
      clearTimeout(deadline);
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => { if (!disposed) release(); });
      });
    };
    // A failed image/font must never leave the page blocked indefinitely.
    const deadline = setTimeout(finish, 3500);
    void assets.then(finish);
    return () => {
      disposed = true;
      clearTimeout(deadline);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      release();
    };
  }, [pathname, register]);

  useEffect(() => clearTimer, [clearTimer]);

  return (
    <PageLoadingContext.Provider value={register}>
      {children}
      {phase !== 'hidden' && <LoadingVisual fading={phase === 'fading'} />}
    </PageLoadingContext.Provider>
  );
}
