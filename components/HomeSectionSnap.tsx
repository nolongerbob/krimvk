"use client";

import { useEffect } from 'react';

/** Release section snapping after the last full-screen section on narrow layouts. */
export function HomeSectionSnap() {
  useEffect(() => {
    const root = document.documentElement;
    const narrow = matchMedia('(max-width: 1279px)');
    let frame = 0;
    // Streaming/hydration can expose the footer before the opening section is
    // laid out. Native snapping must not select it on the initial page load.
    // Arm snapping on a real scrolling gesture; keep history/hash restoration.
    let armed = false;
    const arm = () => {
      if (!armed) { root.setAttribute('data-home-snap-ready', ''); armed = true; }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]')) return;
      arm();
    };
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
    window.addEventListener('wheel', arm, { passive: true });
    window.addEventListener('touchmove', arm, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('wheel', arm);
      window.removeEventListener('touchmove', arm);
      window.removeEventListener('keydown', onKeyDown);
      root.removeAttribute('data-home-free-scroll');
      root.removeAttribute('data-home-snap-ready');
    };
  }, []);
  return null;
}
