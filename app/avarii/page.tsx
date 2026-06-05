"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { sitePageClass, siteContainerClass } from "@/components/site/site-styles";

// Типы для компонента карты
interface MapMarker {
  id: number;
  name: string;
  coords: [number, number];
  text: string;
  time: string;
}

interface EmergencyMapProps {
  markers: MapMarker[];
}

// Динамический импорт карты (Leaflet не работает с SSR)
const EmergencyMap: ComponentType<EmergencyMapProps> = dynamic(
  () => import("@/components/EmergencyMap") as Promise<{ default: ComponentType<EmergencyMapProps> }>,
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] bg-slate-100 rounded-none flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    ),
  }
);

interface EmergencyMessage {
  id: number;
  text: string;
  date: string;
  hasPhoto: boolean;
  photoUrl?: string;
}

// Координаты населённых пунктов Крыма
const LOCATION_COORDS: Record<string, [number, number]> = {
  // Сакский район
  "виноградово": [45.1833, 33.5833],
  "лесновка": [45.2167, 33.5500],
  "штормовое": [45.2833, 33.0500],
  "червоное": [45.1500, 33.6333],
  "поповка": [45.3167, 33.0667],
  "лиманное": [45.1667, 33.4167],
  "фурманово": [45.1333, 33.5667],
  "михайловка": [45.1500, 33.5000],
  "рунное": [45.1833, 33.4500],
  "саки": [45.1333, 33.6000],
  "новофёдоровка": [45.2000, 33.5667],
  "орехово": [45.1167, 33.6500],
  "ромашкино": [45.1000, 33.5833],
  "крымское": [45.0833, 33.5500],
  "веселовка": [45.1000, 33.4500],
  "столбовое": [45.1500, 33.5333],
  "ильинка": [45.2000, 33.4833],
  "геройское": [45.2333, 33.5167],
  "воробьёво": [45.2500, 33.5333],
  "елизаветово": [45.1667, 33.5000],
  
  // Симферопольский район
  "гвардейское": [44.9167, 34.0333],
  "чайкино": [44.9500, 34.0500],
  "скворцово": [44.8833, 34.1167],
  "красное": [44.9000, 34.2000],
  "межгорное": [44.8500, 34.1500],
  "кольчугино": [44.8667, 34.0833],
  "перово": [44.9333, 34.0167],
  "укромное": [44.8833, 34.0500],
  "мирное": [44.9500, 34.1333],
  "молодёжное": [44.9167, 34.1000],
  "добровольное": [44.8667, 34.2333],
  "симферополь": [44.9521, 34.1024],
  "николаевка": [44.9667, 33.6167],
  "донское": [44.9333, 34.1833],
  "новоандреевка": [44.8500, 34.0333],
  "пионерское": [44.8333, 34.0667],
  "трудовое": [44.9000, 34.1500],
  
  // Первомайский район
  "октябрьское": [45.3833, 34.0833],
  "правда": [45.4000, 34.1167],
  "первомайское": [45.4500, 34.0500],
  "островское": [45.4167, 34.0333],
  "войково": [45.3667, 34.1333],
  "гришино": [45.4333, 34.0167],
  
  // Красногвардейский район
  "красногвардейское": [45.4000, 34.4500],
  "восход": [45.3833, 34.5000],
  "марьяновка": [45.3500, 34.4833],
  
  // Джанкойский район
  "джанкой": [45.7167, 34.3833],
  "азовское": [45.7500, 34.5833],
  "ермаково": [45.6833, 34.4167],
  
  // Красноперекопский район
  "красноперекопск": [46.0667, 33.8000],
  "армянск": [46.1167, 33.6833],
  "воинка": [45.9833, 33.7667],
  
  // Черноморский район
  "черноморское": [45.5083, 32.6950],
  "оленевка": [45.3833, 32.5333],
  "межводное": [45.5833, 32.8500],
  
  // Раздольненский район
  "раздольное": [45.7667, 33.4833],
  "ботаническое": [45.7333, 33.5500],
  
  // Города
  "евпатория": [45.1900, 33.3667],
  "керчь": [45.3531, 36.4747],
  "феодосия": [45.0317, 35.3825],
  "ялта": [44.4952, 34.1663],
  "алушта": [44.6767, 34.4100],
  "судак": [44.8508, 34.9742],
  "бахчисарай": [44.7525, 33.8611],
  "севастополь": [44.6054, 33.5220],
  "белогорск": [45.0500, 34.6000],
  "старый крым": [45.0333, 35.0833],
};

// Извлечение локации из текста
function extractLocation(text: string): { name: string; coords: [number, number] } | null {
  const lowerText = text.toLowerCase();
  
  for (const [name, coords] of Object.entries(LOCATION_COORDS)) {
    if (lowerText.includes(name)) {
      const regex = new RegExp(name, "i");
      const match = text.match(regex);
      return {
        name: match ? match[0].toUpperCase() : name.toUpperCase(),
        coords,
      };
    }
  }
  
  return null;
}

export default function AvariiPage() {
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/telegram/emergencies", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages(data.messages || []);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Error fetching emergencies:", err);
      setError("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загружаем сообщения при монтировании
  useEffect(() => {
    fetchMessages();

    // Автообновление каждые 2 минуты
    const interval = setInterval(fetchMessages, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Извлекаем локации из сообщений для карты
  const mapMarkers = useMemo(() => {
    const markers: MapMarker[] = [];

    for (const msg of messages) {
      const location = extractLocation(msg.text);
      if (location) {
        markers.push({
          id: msg.id,
          name: location.name,
          coords: location.coords,
          text: msg.text,
          time: new Date(msg.date).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    }

    return markers;
  }, [messages]);

  // Форматирование времени
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  };

  // Парсинг текста сообщения для выделения адресов
  const parseMessageText = (text: string) => {
    return text.split("\n").map((line, index) => {
      const isAddress = /(?:ул\.|улица|пер\.|переулок|пр\.|проспект|г\.|город|с\.|село|пгт)/i.test(line);
      const isImportant = /(?:внимание|важно|срочно|отключен|восстановлен|работы)/i.test(line);

      if (isAddress) {
        return (
          <span key={index} className="flex items-start gap-1 text-blue-700 font-medium">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {line}
          </span>
        );
      }

      if (isImportant) {
        return (
          <span key={index} className="text-red-600 font-semibold">
            {line}
          </span>
        );
      }

      return <span key={index}>{line}</span>;
    });
  };

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`${sitePageClass} py-8`}>
      <div className={`${siteContainerClass} max-w-5xl`}>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-none">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Аварийные работы</h1>
            <p className="text-slate-600">
              Информация об отключениях на {today}
            </p>
          </div>
        </div>

        {/* Контакты аварийной службы */}
        <Alert className="bg-red-50 border-red-200">
          <Phone className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Аварийно-диспетчерская служба:</strong>{" "}
            <a href="tel:+79787013050" className="font-semibold hover:underline">
              +7 (978) 701-30-50
            </a>{" "}
            или{" "}
            <a href="tel:+79787460990" className="font-semibold hover:underline">
              +7 (978) 746-09-90
            </a>
          </AlertDescription>
        </Alert>
      </div>

      {/* Карта - всегда показываем */}
      <DashboardCard className="mb-6 overflow-hidden">
        <div className="py-3 px-4 bg-slate-50 border-b p-6 pb-4" >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <span className="font-medium">Карта отключений</span>
              {mapMarkers.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {mapMarkers.length} {mapMarkers.length === 1 ? "точка" : mapMarkers.length < 5 ? "точки" : "точек"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {lastUpdate ? (
                <span>
                  {lastUpdate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : (
                <span>...</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMessages}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DashboardCardBody className="p-0">
          {mapMarkers.length > 0 ? (
            <EmergencyMap markers={mapMarkers} />
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-green-50">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">На карте нет отключений</p>
              </div>
            </div>
          )}
        </DashboardCardBody>
      </DashboardCard>

      {/* Список новостей */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Сообщения за сегодня
          </h2>
          {messages.length > 0 && (
            <Badge variant="outline">
              {messages.length} {messages.length === 1 ? "сообщение" : messages.length < 5 ? "сообщения" : "сообщений"}
            </Badge>
          )}
        </div>

        {isLoading && messages.length === 0 ? (
          <DashboardCard>
            <DashboardCardBody className="py-8 text-center">
              <Loader2 className="h-8 w-8 text-slate-400 mx-auto mb-3 animate-spin" />
              <p className="text-slate-500">Загрузка...</p>
            </DashboardCardBody>
          </DashboardCard>
        ) : error ? (
          <DashboardCard className="border-red-200 bg-red-50">
            <DashboardCardBody className="py-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchMessages}>
                Попробовать снова
              </Button>
            </DashboardCardBody>
          </DashboardCard>
        ) : messages.length === 0 ? (
          <DashboardCard className="border-green-200 bg-green-50">
            <DashboardCardBody className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-green-700 mb-1">
                Аварий на сегодня нет
              </h3>
              <p className="text-green-600">
                Плановых и аварийных отключений не зафиксировано
              </p>
            </DashboardCardBody>
          </DashboardCard>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => (
              <DashboardCard key={message.id}>
                <DashboardCardBody className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.date)}
                    </Badge>
                    <span className="text-xs text-slate-400">{formatDate(message.date)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm space-y-1">
                    {parseMessageText(message.text)}
                  </div>
                </DashboardCardBody>
              </DashboardCard>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки внизу */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild variant="destructive" className="flex-1 gap-2">
          <Link href="/emergency">
            <MessageCircle className="h-4 w-4" />
            Сообщить об аварии
          </Link>
        </Button>
        {process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK && (
          <Button asChild variant="outline" className="flex-1 gap-2">
            <a
              href={process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Telegram канал
            </a>
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
