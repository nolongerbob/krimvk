'use client';

import { seasonalEnabled, assistantEnabled } from '@/lib/release-features';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AssistantChat, type PetOrigin } from './AssistantChat';
import { readSeasonalPreview, shouldShowSeasonalPet, shouldShowSeasonalEffects, SEASONAL_PREVIEW_EVENT } from '@/lib/seasonal-preview';
import { startAutumnScene } from './autumn-scene';
import { prepareSpriteFrames } from './sprite-frames';

function CornerPet({ onClick, quiet, mobile = false }: { onClick: () => void; quiet: boolean; mobile?: boolean }) {
  const [spriteReady, setSpriteReady] = useState(false);
  const [hint, setHint] = useState(false);
  const windUntil = useRef(0);
  useEffect(() => {
    if (!mobile) return;
    const blow = () => { windUntil.current = performance.now() + 1200; };
    window.addEventListener('kapelka-mobile-blow', blow);
    return () => window.removeEventListener('kapelka-mobile-blow', blow);
  }, [mobile]);
  useEffect(() => {
    if (!mobile) return;
    try { if (sessionStorage.getItem('kapelka-mobile-hint')) return; sessionStorage.setItem('kapelka-mobile-hint', '1'); } catch { /* Storage may be unavailable. */ }
    setHint(true);
    const timer = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(timer);
  }, [mobile]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const drag = useRef<null | { id: number; startX: number; startY: number; left: number; top: number; lastX: number; lean: number; moved: boolean }>(null);
  const suppressClick = useRef(false);
  const returning = useRef(false);
  useEffect(() => {
    let disposed = false;
    let raf = 0;
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      // Settled standing pose: level eyes/feet and a relaxed smile, not the
      // elongated liquid-transition pose used by the autumn simulation.
      const frames = prepareSpriteFrames(image, 6, 240);
      const context = canvas.current?.getContext('2d');
      if (!frames[5] || !context) return;
      let previous = 0, elapsed = 0;
      const draw = (now: number) => {
        if (disposed) return;
        if (!document.hidden) {
          elapsed += previous ? Math.min(now - previous, 50) : 0;
          // Quiet pauses alternate with two little hops, bubbles and a smile.
          const phase = (elapsed % (mobile ? 10000 : 20000)) / 1000;
          const active = !quiet && !drag.current && !returning.current;
          const jumping = active && !mobile && phase >= 4 && phase < 5.6;
          const blowing = active && (mobile ? now < windUntil.current : phase >= 10 && phase < 13);
          const waving = active && (mobile ? phase >= 3 && phase < 4.6 : phase >= 16 && phase < 17.2);
          const jumpProgress = ((phase - 4) % .8) / .8;
          let frameIndex = 5;
          if (jumping) frameIndex = jumpProgress < .15 ? 5 : jumpProgress < .45 ? 1 : jumpProgress < .75 ? 4 : 2;
          if (waving) frameIndex = [5, 4, 4, 5][Math.floor(elapsed / 180) % 4];
          if (blowing) frameIndex = 0;
          if (drag.current?.moved) frameIndex = [0, 1, 2, 3, 1, 4][Math.floor(elapsed / 120) % 6];
          const frame = frames[frameIndex];
          const hop = jumping ? Math.sin(jumpProgress * Math.PI) * 16 : 0;
          // Move the canvas smoothly at CSS resolution; do not resample the
          // pixels inside each frame or jitter them by whole source pixels.
          if (canvas.current) {
            const lean = drag.current?.moved ? drag.current.lean : jumping ? Math.sin(jumpProgress * Math.PI * 2) * 4 : 0;
            canvas.current.style.transformOrigin = drag.current ? '50% 20%' : '50% 95%';
            const breath = mobile && active ? Math.sin(elapsed / 650) : 0;
            canvas.current.style.transform = mobile
              ? `translateY(${-Math.max(0, breath) * 1.5}px) rotate(${breath * 1.2}deg) scale(${1 - breath * .012}, ${1 + breath * .018})`
              : `translateY(${-hop}px) rotate(${lean}deg)`;
          }
          context.imageSmoothingEnabled = false;
          context.clearRect(0, 0, 256, 256);
          context.drawImage(frame, 0, 0);
          // Small pixel bubbles leave the face and float away inside the sprite.
          // No full-screen particles, collisions or autumn engine on these pages.
          if (blowing && !mobile) for (let i = 0; i < 4; i++) {
            const age = phase - 10 - i * .45;
            if (age < 0 || age > 1.5) continue;
            const x = Math.round((116 + age * 65) / 2) * 2;
            const y = Math.round((156 - age * 68) / 2) * 2;
            const radius = 4 + Math.floor(age * 3) * 2;
            context.globalAlpha = Math.min(1, (1.5 - age) * 3);
            context.fillStyle = '#71cee9';
            context.fillRect(x-radius+2,y-radius,radius*2-4,2);
            context.fillRect(x-radius+2,y+radius-2,radius*2-4,2);
            context.fillRect(x-radius,y-radius+2,2,radius*2-4);
            context.fillRect(x+radius-2,y-radius+2,2,radius*2-4);
            context.fillStyle = '#e0faff';
            context.fillRect(x-radius+3,y-radius+3,3,3);
          }
          context.globalAlpha = 1;
          if (blowing && mobile) {
            context.strokeStyle = '#d8f6ff'; context.lineWidth = 3;
            for (let i=0;i<3;i++) {
              const travel=((now/500+i*.3)%1)*48;
              context.globalAlpha=1-travel/48;
              context.beginPath();context.moveTo(112-travel,145+i*10);context.lineTo(94-travel,145+i*10);context.stroke();
            }
            context.globalAlpha=1;
          }
        }
        previous = now;
        if (!quiet) raf = requestAnimationFrame(draw);
      };
      draw(0);
      setSpriteReady(true);
    };
    image.src = '/images/seasonal/kapelka-drag.webp';
    return () => { disposed = true; image.onload = null; cancelAnimationFrame(raf); };
  }, [quiet, mobile]);
  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    const held = drag.current;
    if (!held || held.id !== event.pointerId) return;
    drag.current = null;
    suppressClick.current = held.moved;
    returning.current = held.moved && !quiet;
    const element = event.currentTarget;
    element.dataset.dragging = 'false';
    element.style.cursor = 'grab';
    element.style.transition = quiet ? 'none' : 'transform 260ms cubic-bezier(.2,.8,.2,1)';
    element.style.transform = 'translate(0px, 0px)';
    if (canvas.current) canvas.current.style.transform = '';
    if (element.hasPointerCapture?.(held.id)) element.releasePointerCapture(held.id);
  };
  return <button ref={button} type="button" data-seasonal-corner-pet aria-label="Открыть помощника Капельку"
    onPointerDown={event => {
      if (mobile || !event.isPrimary || event.button !== 0 || drag.current) return;
      const element = event.currentTarget;
      // Interrupt an in-flight return at its current visual position.
      const box = element.getBoundingClientRect();
      element.style.transition = 'none';
      element.style.transform = 'none';
      const home = element.getBoundingClientRect();
      element.style.transform = `translate(${box.left-home.left}px, ${box.top-home.top}px)`;
      drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, left: box.left, top: box.top, lastX: event.clientX, lean: 0, moved: false };
      returning.current = false;
      suppressClick.current = false;
      element.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      const held = drag.current;
      if (!held || held.id !== event.pointerId) return;
      const dx = event.clientX-held.startX, dy = event.clientY-held.startY;
      if (!held.moved && Math.hypot(dx,dy)<5) return;
      held.moved = true;
      held.lean = Math.max(-12,Math.min(12,(event.clientX-held.lastX)*.8));
      held.lastX = event.clientX;
      const element = event.currentTarget;
      const right = parseFloat(getComputedStyle(element).right)||12;
      const bottom = parseFloat(getComputedStyle(element).bottom)||12;
      const header = document.querySelector('#site-header, header')?.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const minY = Math.min(Math.max(0,header?.bottom||0),Math.max(0,window.innerHeight-112));
      const x = Math.max(0,Math.min(viewportWidth-112,held.left+dx));
      const y = Math.max(minY,Math.min(window.innerHeight-112,held.top+dy));
      element.style.transform = `translate(${x-(viewportWidth-112-right)}px, ${y-(window.innerHeight-112-bottom)}px)`;
      element.style.cursor = 'grabbing';
      element.dataset.dragging = 'true';
    }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onTransitionEnd={event => { if(event.target===event.currentTarget) returning.current=false; }}
    onClick={event => { if(suppressClick.current && event.detail!==0){event.preventDefault();suppressClick.current=false;return;} onClick(); }}
    className={`${spriteReady ? 'seasonal-corner-enter' : 'invisible'} fixed z-40 h-28 w-28 border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600`}
    style={{ width: mobile ? 64 : undefined, height: mobile ? 64 : undefined, right: 'max(12px, env(safe-area-inset-right))', bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + var(--mobile-bottom-panel-height, 0px))', touchAction: mobile ? 'pan-y' : 'none', cursor: mobile ? 'pointer' : 'grab' }}>
    {(!mobile || hint) && <span className={`pointer-events-none absolute right-full ${mobile ? 'top-4' : 'top-10'} mr-1 whitespace-nowrap rounded-2xl border bg-white px-3 py-2 text-xs text-slate-800 shadow-sm`}>Чем могу помочь?</span>}
    <canvas ref={canvas} width={256} height={256} aria-hidden="true" className="h-full w-full [image-rendering:pixelated]" />
  </button>;
}

export function SeasonalPreview() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = matchMedia('(max-width: 639px)');
    const sync = () => setMobile(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  const [enabled, setEnabled] = useState(false);
  const [quiet, setQuiet] = useState(true);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [chatOrigin, setChatOrigin] = useState<PetOrigin>();
  const openChat = () => {
    const element = document.querySelector<HTMLButtonElement>('[data-seasonal-corner-pet]')
      ?? document.querySelector<HTMLButtonElement>('[aria-label="Открыть помощника Капельку"]');
    if (element) {
      const rect=element.getBoundingClientRect();
      let image: string | undefined;
      try { image=element.querySelector('canvas')?.toDataURL(); } catch { /* Geometry-only fallback. */ }
      setChatOrigin({x:rect.left,y:rect.top,width:rect.width,height:rect.height,image});
    }
    setOpen(true);
  };
  const canvas = useRef<HTMLCanvasElement>(null);
  const pet = useRef<HTMLButtonElement>(null);
  const sprite = useRef<HTMLCanvasElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const [pastHome, setPastHome] = useState(false);
  useEffect(() => {
    if (path !== '/') { setPastHome(false); return; }
    let frame = 0;
    const update = () => {
      const first = document.querySelector('[data-seasonal-home] > div');
      const headerBottom = document.getElementById('site-header')?.getBoundingClientRect().bottom ?? 72;
      const bottom = first?.getBoundingClientRect().bottom;
      // A dead band keeps scroll snapping / fractional resize measurements
      // from repeatedly mounting the corner companion at the section edge.
      setPastHome(current => bottom !== undefined && (current ? bottom <= headerBottom + 48 : bottom <= headerBottom + 1));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [path]);
  const [runtime, setRuntime] = useState({ mascotEnabled: false, autumnEnabled: false });
  const showPet = shouldShowSeasonalPet(path) && (process.env.NODE_ENV !== 'production' || runtime.mascotEnabled);
  const showEffects = !mobile && shouldShowSeasonalEffects(path) && (process.env.NODE_ENV !== 'production' || runtime.autumnEnabled);
  const showLane = showEffects && !mobile && path !== '/';
  const embeddedChat = path === '/dashboard/questions';
  const seedSurfaces = !(path === '/dashboard' || path.startsWith('/dashboard/'));
  const assistantOpen = showPet && open;
  useEffect(() => {
    if (!seasonalEnabled() && !assistantEnabled()) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (process.env.NODE_ENV !== 'production') setEnabled(readSeasonalPreview());
      setQuiet(motion.matches || document.documentElement.classList.contains('bvi-active') || document.body.classList.contains('bvi-active'));
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync(); motion.addEventListener('change', sync);
    window.addEventListener('storage', sync); window.addEventListener(SEASONAL_PREVIEW_EVENT, sync);
    return () => { observer.disconnect(); motion.removeEventListener('change', sync); window.removeEventListener('storage', sync); window.removeEventListener(SEASONAL_PREVIEW_EVENT, sync); };
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    let alive = true, busy = false;
    const controller = new AbortController();
    async function refresh() {
      if (busy) return;
      busy = true;
      try {
        const r = await fetch('/api/site-settings', { cache: 'no-store', signal: controller.signal });
        if (!r.ok) throw new Error('settings');
        const data = await r.json();
        if (alive) {
          const mascotEnabled = assistantEnabled() && data.mascotEnabled === true;
          const autumnEnabled = seasonalEnabled() && data.autumnEnabled === true;
          setRuntime({ mascotEnabled, autumnEnabled });
          setEnabled(mascotEnabled || autumnEnabled);
        }
      } catch { if (alive) { setEnabled(false); setRuntime({ mascotEnabled: false, autumnEnabled: false }); } }
      finally { busy = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 30000);
    return () => { alive = false; controller.abort(); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!enabled || !showEffects || embeddedChat || quiet || paused || !canvas.current || !lane.current) return;
    if (showPet && !mobile && (!pet.current || !sprite.current)) return;
    return startAutumnScene(canvas.current, pet.current || document.createElement('button'), sprite.current || document.createElement('canvas'), lane.current, {
      petEnabled: showPet && !mobile,
      seedSurfaces: mobile ? false : seedSurfaces,
      fullPage: mobile,
    });
  }, [enabled, quiet, paused, embeddedChat, seedSurfaces, showPet, showEffects, mobile]);
  if ((!seasonalEnabled() && !assistantEnabled()) || !enabled || path === '/dashboard/questions') return null;
  return <div data-seasonal-ui data-assistant-open={assistantOpen || undefined} className="print:hidden">
    <div ref={lane} data-seasonal-lane className={showLane ? 'relative h-36 w-full overflow-hidden border-b border-amber-800/25' : 'relative h-0 w-full'}>
    {showEffects && !quiet && !paused && <>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 max-w-full" />
      {showPet && !mobile && <button ref={pet} type="button" aria-label="Открыть помощника Капельку" onClick={openChat} className="fixed left-0 top-0 z-40 h-28 w-28 border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        <span data-seasonal-bubble className="pointer-events-none absolute left-full top-10 ml-1 whitespace-nowrap rounded-2xl border bg-white px-3 py-2 text-xs text-slate-800 shadow-sm">Чем могу помочь?</span>
        <canvas ref={sprite} width={256} height={256} aria-hidden="true" className="h-full w-full [image-rendering:pixelated]" />
      </button>}
    </>}
    </div>
    {showPet && (!mobile || path !== '/' || pastHome) && (mobile || !showEffects || pastHome || quiet || paused) && <CornerPet quiet={quiet} mobile={mobile} onClick={openChat} />}
    {showPet && mobile && <div data-assistant-mobile-spacer aria-hidden="true" style={{height:'calc(88px + env(safe-area-inset-bottom))'}} />}
    {showLane && process.env.NODE_ENV === 'development' && <div className="flex flex-wrap justify-end gap-2 border-t bg-white p-2 text-xs text-slate-800">
      <button type="button" onClick={openChat} className="min-h-11 px-2">Капелька · DEV</button>
      {!quiet && <button type="button" onClick={() => setPaused(v => !v)} className="min-h-11 px-2">{paused ? 'Продолжить' : 'Пауза'}</button>}
    </div>}
    {showPet && <AssistantChat open={assistantOpen} onOpenChange={setOpen} origin={chatOrigin} />}
  </div>;
}
