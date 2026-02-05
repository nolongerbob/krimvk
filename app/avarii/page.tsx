"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

interface EmergencyMessage {
  id: number;
  text: string;
  date: string;
  hasPhoto: boolean;
  photoUrl?: string;
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
    <div className="container py-8 px-4 max-w-5xl">
      {/* Заголовок */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Аварийные работы</h1>
            <p className="text-gray-600">
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
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500">Загрузка...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchMessages}>
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        ) : messages.length === 0 ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-green-700 mb-1">
                Аварий на сегодня нет
              </h3>
              <p className="text-green-600">
                Плановых и аварийных отключений не зафиксировано
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.date)}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatDate(message.date)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm space-y-1">
                    {parseMessageText(message.text)}
                  </div>
                </CardContent>
              </Card>
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
  );
}
