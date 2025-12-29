"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  text: string;
  imageUrl: string | null;
  isFromAdmin: boolean;
  createdAt: Date;
}

interface Question {
  id: string;
  status: string;
  messages: Message[];
}

interface QuestionsChatProps {
  question: Question;
}

export function QuestionsChat({ question: initialQuestion }: QuestionsChatProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Проверяем, находится ли пользователь внизу чата
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // Порог в пикселях
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Скроллим вниз только при отправке своего сообщения или при первой загрузке
  const lastMessageIdsRef = useRef<Set<string>>(new Set(question.messages.map(m => m.id)));
  const shouldAutoScrollRef = useRef(false);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // При первой загрузке - скроллим вниз
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      setTimeout(() => scrollToBottom(), 100);
      lastMessageIdsRef.current = new Set(question.messages.map(m => m.id));
      return;
    }

    // Проверяем, есть ли новые сообщения
    const currentMessageIds = new Set(question.messages.map(m => m.id));
    const hasNewMessages = question.messages.some(m => !lastMessageIdsRef.current.has(m.id));

    if (hasNewMessages) {
      // Если это наше сообщение или пользователь был внизу - скроллим
      if (shouldAutoScrollRef.current || isNearBottom()) {
        setTimeout(() => scrollToBottom(), 100);
      }
      lastMessageIdsRef.current = currentMessageIds;
      shouldAutoScrollRef.current = false;
    }
  }, [question.messages]);

  // Автоматическое обновление сообщений каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/questions/list");
        if (response.ok) {
          const data = await response.json();
          if (data.question) {
            const wasNearBottom = isNearBottom();
            setQuestion((prev) => {
              const oldMessageCount = prev.messages.length;
              // Если были новые сообщения и пользователь был внизу - скроллим
              if (data.question.messages.length > oldMessageCount && wasNearBottom) {
                setTimeout(() => scrollToBottom(), 100);
              }
              return data.question;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Пожалуйста, выберите изображение");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert("Размер файла не должен превышать 20MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || isLoading || isUploadingImage) return;

    setIsLoading(true);
    let imageUrl: string | null = null;

    try {
      // Сначала загружаем изображение, если оно есть
      if (selectedImage) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", selectedImage);

        const uploadResponse = await fetch("/api/messages/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Ошибка при загрузке изображения");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
        setIsUploadingImage(false);
      }

      // Отправляем сообщение
      const response = await fetch("/api/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: newMessage.trim() || "", 
          imageUrl 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Помечаем, что нужно скроллить (это наше сообщение)
        shouldAutoScrollRef.current = true;
        // Очищаем форму
        setNewMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Обновляем список сообщений (включая автоматическое сообщение)
        router.refresh();
        // Загружаем обновленный диалог
        const refreshResponse = await fetch("/api/questions/list");
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.question) {
            setQuestion(refreshData.question);
          }
        }
      } else {
        const error = await response.json();
        console.error("Error sending message:", error);
        alert(error.error || "Ошибка при отправке сообщения");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ошибка при отправке сообщения");
      setIsUploadingImage(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden">
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* История сообщений */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {question.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="h-12 w-12 mb-4 text-gray-400" />
              <p>Пока нет сообщений. Задайте первый вопрос!</p>
            </div>
          ) : (
            question.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.isFromAdmin
                      ? "bg-gray-100 text-gray-900"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {message.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <Image
                        src={message.imageUrl}
                        alt="Прикрепленное изображение"
                        width={400}
                        height={300}
                        className="object-contain max-w-full h-auto"
                        unoptimized
                      />
                    </div>
                  )}
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.isFromAdmin ? "text-gray-500" : "text-blue-100"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Форма отправки сообщения */}
        <div className="border-t p-4 flex-shrink-0 bg-white">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-blue-500">
                <Image
                  src={imagePreview}
                  alt="Предпросмотр"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите ваше сообщение..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={isLoading || isUploadingImage}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploadingImage}
                title="Прикрепить изображение"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isUploadingImage || (!newMessage.trim() && !selectedImage)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          {isUploadingImage && (
            <p className="text-xs text-gray-500 mt-2">Загрузка изображения...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
