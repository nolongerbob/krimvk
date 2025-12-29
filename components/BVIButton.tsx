"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { getCookie, setCookie, stringToBoolean } from "@/lib/bvi-utils";

export function BVIButton() {
  const [isActive, setIsActive] = useState(false);

  // Проверяем, активна ли панель при загрузке
  useEffect(() => {
    const panelActive = stringToBoolean(getCookie('panelActive'));
    setIsActive(panelActive);
  }, []);

  const handleOpen = useCallback(() => {
    if (isActive) return;

    // Сохраняем конфигурацию в cookies
    const defaultConfig = {
      fontSize: 100,
      theme: 'white',
      images: 'grayscale',
      letterSpacing: 'normal',
      lineHeight: 'normal',
      speech: true,
      fontFamily: 'arial',
      builtElements: false,
    };

    Object.keys(defaultConfig).forEach((key) => {
      setCookie(key, (defaultConfig as any)[key].toString());
    });
    setCookie('panelActive', 'true');

    setIsActive(true);
    
    // Диспатчим событие для BVIPanel
    window.dispatchEvent(new CustomEvent('bvi-open'));
  }, [isActive]);

  // Слушаем события от BVIPanel
  useEffect(() => {
    const handleBVIStateChange = () => {
      const panelActive = stringToBoolean(getCookie('panelActive'));
      setIsActive(panelActive);
    };

    window.addEventListener('bvi-state-change', handleBVIStateChange);
    return () => {
      window.removeEventListener('bvi-state-change', handleBVIStateChange);
    };
  }, []);

  // Скрываем кнопку, если панель уже активна
  if (isActive) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handleOpen}
      variant="ghost"
      size="icon"
      className="h-9 w-9 focus:outline-none focus-visible:outline-none active:outline-none"
      aria-label="Версия для слабовидящих"
      title="Версия для слабовидящих"
    >
      <Eye className="h-5 w-5" />
    </Button>
  );
}

