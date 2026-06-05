'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { openBviPanel } from '@/lib/bvi-loader';
import { prepareSpeechForUserGesture } from '@/lib/bvi-speech-patch';

/**
 * Версия для слабовидящих — плагин isvek только по клику (не при загрузке страницы).
 */
export function BVIButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (busy) return;
    prepareSpeechForUserGesture();
    setBusy(true);
    try {
      await openBviPanel();
    } catch (err) {
      console.error('[BVI]', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-none text-slate-900 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
        className
      )}
      aria-label="Версия для слабовидящих"
      title="Версия для слабовидящих"
      disabled={busy}
      onPointerDown={() => prepareSpeechForUserGesture()}
      onClick={handleClick}
    >
      <Eye className="h-5 w-5" aria-hidden />
    </button>
  );
}
