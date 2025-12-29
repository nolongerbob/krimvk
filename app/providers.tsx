"use client";

import { SessionProvider } from "next-auth/react";
import { GlobalLoading } from "@/components/GlobalLoading";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isInitialMount = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Показываем загрузчик только при первой загрузке главной страницы
    if (isInitialMount.current && isHomePage) {
      isInitialMount.current = false;
      setIsLoading(true);

      // Логика загрузчика только для главной страницы
      const minDisplayTime = 2000;
      const startTime = Date.now();

      const hideLoader = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      };

      if (document.readyState === "complete") {
        hideLoader();
      } else {
        window.addEventListener("load", hideLoader);
      }

      const fallbackTimer = setTimeout(() => {
        hideLoader();
      }, minDisplayTime + 500);

      return () => {
        clearTimeout(fallbackTimer);
        window.removeEventListener("load", hideLoader);
      };
    } else {
      // При переходах между страницами загрузчик не показываем
      isInitialMount.current = false;
      setIsLoading(false);
    }
  }, [isHomePage, pathname]);

  return (
    <SessionProvider>
      {isLoading && isHomePage && <GlobalLoading />}
      <div className={`transition-opacity duration-500 ${isLoading && isHomePage ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
    </SessionProvider>
  );
}

