'use client';

import Script from 'next/script';
import { useCallback, useRef } from 'react';

declare global {
  interface Window {
    isvek?: {
      Bvi: new (options?: {
        target?: string;
        lang?: string;
        speech?: boolean;
        panelFixed?: boolean;
        panelHide?: boolean;
        reload?: boolean;
      }) => void;
    };
  }
}

/** Официальный плагин https://github.com/veks/button-visually-impaired-javascript */
export function BviPlugin() {
  const initialized = useRef(false);

  const initBvi = useCallback(() => {
    if (initialized.current || typeof window === 'undefined' || !window.isvek?.Bvi) {
      return;
    }
    // Дождаться гидрации кнопок .bvi-open в Header
    const tryInit = (attempt = 0) => {
      const triggers = document.querySelectorAll('.bvi-open');
      if (triggers.length === 0 && attempt < 20) {
        window.setTimeout(() => tryInit(attempt + 1), 50);
        return;
      }
      if (initialized.current) return;
      initialized.current = true;
      new window.isvek!.Bvi({
        target: '.bvi-open',
        lang: 'ru-RU',
        speech: true,
        panelFixed: true,
        panelHide: false,
        reload: false,
      });
    };
    tryInit();
  }, []);

  return (
    <Script
      src="/bvi/js/bvi.min.js"
      strategy="afterInteractive"
      onLoad={initBvi}
    />
  );
}
