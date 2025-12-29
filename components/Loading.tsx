"use client";

import { useEffect, useState } from "react";

export function Loading() {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Симуляция прогресса
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Ускоряемся к концу
        const increment = prev < 70 ? 2 : prev < 90 ? 1.5 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      // Небольшая задержка перед началом исчезновения
      setTimeout(() => {
        setIsFading(true);
      }, 300);
    }
  }, [progress]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center space-y-8">
        {/* Крутилка */}
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin absolute top-0 left-0"></div>
          {/* Внутренний круг */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-blue-200 rounded-full"></div>
          </div>
        </div>

        {/* Прогресс бар */}
        <div className="w-64 space-y-2">
          <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white opacity-30 animate-shimmer"></div>
            </div>
          </div>
          <p className="text-center text-blue-600 font-medium text-sm">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

