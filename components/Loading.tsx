'use client';

import { useEffect, useState } from 'react';

export function Loading() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = prev < 70 ? 2 : prev < 90 ? 1.5 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setHidden(true), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);

  if (hidden) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 transition-opacity duration-500 ${
        progress >= 100 ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex w-64 flex-col items-center gap-6">
        <div className="h-10 w-10 animate-spin border-2 border-slate-200 border-t-blue-600" />
        <div className="w-full space-y-2">
          <div className="h-1 w-full overflow-hidden bg-slate-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-slate-500">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
