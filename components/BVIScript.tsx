"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    isvek?: {
      Bvi: new (options?: any) => void;
    };
  }
}

export function BVIScript() {
  useEffect(() => {
    // Проверяем, загружен ли скрипт после монтирования компонента
    const checkScript = () => {
      if (typeof window !== 'undefined' && window.isvek) {
        console.log("BVI script is available");
        window.dispatchEvent(new CustomEvent("bvi-loaded"));
      }
    };

    // Проверяем сразу
    checkScript();

    // Также проверяем периодически (на случай, если скрипт загрузится асинхронно)
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.isvek) {
        checkScript();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <Script 
      id="bvi-script"
      src="/bvi/js/bvi.min.js" 
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined') {
          // Даем скрипту время на инициализацию
          setTimeout(() => {
            if (window.isvek) {
              console.log("BVI script loaded successfully, isvek available");
              window.dispatchEvent(new CustomEvent("bvi-loaded"));
            } else {
              console.warn("BVI script loaded but isvek is not available");
            }
          }, 100);
        }
      }}
      onError={(e) => {
        console.error("BVI script failed to load:", e);
      }}
      onReady={() => {
        if (typeof window !== 'undefined' && window.isvek) {
          console.log("BVI script is ready");
          window.dispatchEvent(new CustomEvent("bvi-loaded"));
        }
      }}
    />
  );
}

