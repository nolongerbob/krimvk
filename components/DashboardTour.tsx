"use client";

import { useState, useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle, X } from "lucide-react";

const STORAGE_DECLINED = "lk_tour_declined";
const STORAGE_COMPLETED = "lk_tour_completed";

const TOUR_STEPS = [
  {
    element: "[data-tour-id='tour-welcome']",
    popover: {
      title: "Добро пожаловать в личный кабинет",
      description:
        "Здесь вы можете управлять лицевыми счётами, передавать показания, оплачивать счета и подавать заявки.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour-id='tour-balance']",
    popover: {
      title: "Баланс и лицевой счёт",
      description:
        "Текущий баланс, задолженность и данные по выбранному лицевому счёту. Кнопка «Оплатить» ведёт к оплате онлайн.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour-id='tour-stats']",
    popover: {
      title: "Краткая сводка",
      description:
        "Неоплаченные счета, количество счётчиков и активные заявки — всё в одном месте. Нажмите на карточку, чтобы перейти в раздел.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour-id='tour-quick']",
    popover: {
      title: "Быстрые действия",
      description:
        "Подать показания, счета и оплата, квитанции, история платежей, заказать услугу или задать вопрос.",
      side: "top" as const,
      align: "start" as const,
    },
  },
];

function getStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(key);
  } catch {
    return false;
  }
}

function setStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, "1");
  } catch {}
}

export default function DashboardTour() {
  const [showPrompt, setShowPrompt] = useState<boolean | null>(null);

  useEffect(() => {
    if (getStorage(STORAGE_DECLINED) || getStorage(STORAGE_COMPLETED)) {
      setShowPrompt(false);
      return;
    }
    setShowPrompt(true);
  }, []);

  const runTour = useCallback((hidePrompt = true) => {
    if (hidePrompt) setShowPrompt(false);

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0.5)",
      nextBtnText: "Далее",
      prevBtnText: "Назад",
      doneBtnText: "Готово",
      progressText: "{{current}} из {{total}}",
      steps: TOUR_STEPS,
      onDestroyed: () => {
        setStorage(STORAGE_COMPLETED);
      },
    });

    driverObj.drive();
  }, []);

  const decline = useCallback(() => {
    setStorage(STORAGE_DECLINED);
    setShowPrompt(false);
  }, []);

  // Кнопка «Тур» для повторного запуска (когда уже отклонили или прошли)
  const tourButton = (
    <button
      type="button"
      onClick={() => runTour(false)}
      className="fixed bottom-6 right-6 z-[90] flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-200 bg-white text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
      aria-label="Пройти тур по личному кабинету"
      title="Пройти тур"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );

  if (showPrompt === null) return null; // ещё не проверили localStorage
  if (!showPrompt) return tourButton;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="complementary"
      aria-label="Предложение пройти тур по личному кабинету"
    >
      <div className="rounded-xl border-2 border-blue-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-blue-700">
            <HelpCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Тур по личному кабинету</span>
          </div>
          <button
            type="button"
            onClick={decline}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Хотите пройти короткий обзор главных разделов: баланс, счётчики, счета и быстрые действия?
        </p>
        <div className="flex gap-2">
          <Button onClick={runTour} size="sm" className="flex-1">
            Пройти тур
          </Button>
          <Button onClick={decline} variant="ghost" size="sm">
            Позже
          </Button>
        </div>
      </div>
    </div>
  );
}
