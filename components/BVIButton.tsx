'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Кнопка открытия панели BVI (класс .bvi-open — триггер плагина isvek).
 * @see https://github.com/veks/button-visually-impaired-javascript
 */
export function BVIButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'bvi-open h-9 w-9 rounded-none hover:scale-100 active:scale-100 focus:outline-none focus-visible:outline-none active:outline-none',
        className
      )}
      aria-label="Версия для слабовидящих"
      title="Версия для слабовидящих"
    >
      <Eye className="h-5 w-5 pointer-events-none" />
    </Button>
  );
}
