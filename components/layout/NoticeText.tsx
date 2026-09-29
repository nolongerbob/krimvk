"use client";

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

/** Keep the notice row fixed; animate only text that exceeds its available width. */
export function NoticeText({ text }: { text: string }) {
  const host = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const measure = () => {
      const padding = label.current ? parseFloat(getComputedStyle(label.current).paddingRight) || 0 : 0;
      setOverflow((label.current?.scrollWidth ?? 0) - padding > (host.current?.clientWidth ?? 0) + 1);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    if (host.current) observer.observe(host.current);
    if (label.current) observer.observe(label.current);
    return () => observer.disconnect();
  }, [text]);
  return <div className="notice-text">
    <div ref={host} className="viewport" tabIndex={overflow ? 0 : undefined} title={text}>
      <div className="track" data-moving={overflow || undefined} style={{ animationDuration: `${Math.max(15, text.length * .25)}s`, animationPlayState: paused ? 'paused' : undefined }}>
        <span ref={label}>{text}</span>
        {overflow && <span aria-hidden="true">{text}</span>}
      </div>
    </div>
    {overflow && <button type="button" aria-label={paused ? 'Продолжить прокрутку уведомления' : 'Приостановить прокрутку уведомления'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={12} /> : <Pause size={12} />}</button>}
    <style jsx>{`
      .notice-text { display: flex; align-items: center; min-width: 0; flex: 1; gap: 6px; font-size: 14px; line-height: 24px; }
      .viewport { min-width: 0; flex: 1; overflow: hidden; }
      .track { display: flex; width: max-content; }
      .track > span { flex-shrink: 0; white-space: nowrap; }
      .track[data-moving] { animation: notice-text-scroll linear infinite; }
      .track[data-moving] > span { padding-right: 40px; }
      .viewport:hover .track, .viewport:focus .track { animation-play-state: paused; }
      button { flex-shrink: 0; display: grid; place-items: center; width: 24px; height: 24px; }
      button:focus-visible, .viewport:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
      @keyframes notice-text-scroll { to { transform: translateX(-50%); } }
      @media (prefers-reduced-motion: reduce) {
        .viewport { overflow-x: auto; scrollbar-width: none; }
        .track[data-moving] { animation: none; }
        .track > span[aria-hidden], button { display: none; }
      }
    `}</style>
  </div>;
}
