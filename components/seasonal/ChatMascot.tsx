'use client';

import { useEffect, useRef } from 'react';
import { prepareSpriteFrames } from './sprite-frames';

/** Small, round standing character; no dragging/squash poses in the header. */
export function ChatMascot({ thinking }: { thinking: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const active = useRef(thinking);
  useEffect(() => { active.current = thinking; }, [thinking]);
  useEffect(() => {
    let disposed = false, raf = 0, time = 0, last = 0;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const image = new Image();
    let frames: HTMLCanvasElement[] = [];
    const draw = (now: number) => {
      if (disposed) return;
      if (!document.hidden) {
        time += last ? Math.min(now-last,50) : 0;
        const context = canvas.current?.getContext('2d');
        if (context && frames.length) {
          // Relaxed hands at rest; brief cheerful arms/feet movement, then rest.
          const period = active.current ? 2600 : 6500;
          const phase = time % period;
          const waving = !motion.matches && phase > period-900;
          const frame = waving ? [5,4,4,5][Math.floor(phase/180)%4] : 5;
          context.imageSmoothingEnabled = false;
          context.clearRect(0,0,256,256);
          context.drawImage(frames[frame],0,0);
          if (canvas.current) canvas.current.style.transform = waving ? `translateY(${-Math.sin((phase-(period-900))/900*Math.PI)*2}px)` : 'none';
        }
      }
      last = now;
      if (!motion.matches) raf=requestAnimationFrame(draw);
    };
    const resume = () => { cancelAnimationFrame(raf);last=0;draw(0); };
    image.onload = () => { if(disposed)return;frames=prepareSpriteFrames(image,6,240);resume(); };
    image.src='/images/seasonal/kapelka-drag.webp';
    motion.addEventListener('change',resume);
    return () => { disposed=true;image.onload=null;cancelAnimationFrame(raf);motion.removeEventListener('change',resume); };
  }, []);
  return <canvas ref={canvas} width={256} height={256} aria-label="Капелька в шляпе" role="img" className="h-16 w-16 shrink-0 [image-rendering:pixelated]" />;
}
