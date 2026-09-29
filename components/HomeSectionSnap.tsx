"use client";

import { useEffect } from 'react';

/** Release section snapping after the last full-screen section on narrow layouts. */
export function HomeSectionSnap() {
  useEffect(() => {
    const root = document.documentElement;
    const narrow = matchMedia('(max-width: 1279px)');
    let frame = 0;
    const update = () => {
      const about = document.querySelector<HTMLElement>('[data-home-about]');
      // About is hidden on phones; news is the last snapping section there.
      const last = about?.getClientRects().length ? about : document.querySelector<HTMLElement>('[data-home-news]');
      const header = document.getElementById('site-header')?.getBoundingClientRect().height ?? 72;
      const free = narrow.matches && !!last && last.getBoundingClientRect().top <= header + 1;
      root.toggleAttribute('data-home-free-scroll', free);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.removeAttribute('data-home-free-scroll');
    };
  }, []);
  return null;
}
