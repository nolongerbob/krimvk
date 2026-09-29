'use client';

import { useContext, useEffect } from 'react';
import { PageLoadingContext } from './PageLoadingProvider';

export function Loading() {
  const register = useContext(PageLoadingContext);
  useEffect(() => {
    return register?.();
  }, [register]);
  return register ? null : <LoadingVisual />;
}

export function LoadingVisual({ fading = false }: { fading?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Загрузка страницы"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 transition-opacity [transition-duration:650ms] ease-in-out motion-reduce:transition-none ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex w-64 flex-col items-center gap-6">
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          className="h-16 w-16 motion-safe:animate-[spin_3s_linear_infinite] [image-rendering:pixelated]"
        >
          <path
            d="M15 2h2v3h2v4h2V7h2v7h2v-3h2v2h4v4h-2v3h2v2h-4v2h-4v2h-6v4h-2v-4H9v-2H5v-2H1v-2h2v-3H1v-4h4v-2h2v3h2V7h2v2h2V5h2Z"
            fill="#784020"
          />
          <path
            d="M15 5h2v3h2v5h2v-3h1v7h4v-3h3v2h-2v4h2v1h-4v2h-4v2H11v-2H7v-2H3v-1h2v-4H3v-2h3v3h4v-7h1v3h2V8h2Z"
            fill="#E79532"
          />
          <path
            d="M15 5h1v15h-3v-2h-2v-3h2V8h2ZM3 14h3v3h4v2h2v2H7v-2H5v-3H3Z"
            fill="#F8C65B"
          />
          <path
            d="M16 12h1v13h-1ZM12 17h2v2h2v2h-2v-2h-2ZM19 17h2v2h-2v2h-2v-2h2ZM21 23h4v-2h4v-1h-6v2h-2Z"
            fill="#BC6427"
          />
        </svg>
        <p className="text-center text-sm font-medium text-slate-500">Загружаем страницу…</p>
      </div>
    </div>
  );
}
