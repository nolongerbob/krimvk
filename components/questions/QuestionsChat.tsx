"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Image as ImageIcon, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fileHrefForStoredUrl } from "@/lib/file-url";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { cn } from "@/lib/utils";
import { dashboardButtonClass } from "@/components/dashboard/dashboard-styles";

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
  className?: string;
}

const URL_PATTERN = /(https?:\/\/[^\s<]+|\/dashboard\/[^\s<]+)/g;

function formatMessageTime(date: Date | string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessageText(text: string, isAdmin: boolean) {
  const parts = text.split(URL_PATTERN);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("http") || part.startsWith("/dashboard/")) {
      const href = part.startsWith("/") ? part : part;
      return (
        <Link
          key={`${part}-${index}`}
          href={href}
          className={cn(
            "font-medium hover:underline",
            isAdmin ? "text-blue-600" : "text-white underline decoration-blue-200"
          )}
        >
          {part}
        </Link>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function MessageBubble({ message }: { message: Message }) {
  const isAdmin = message.isFromAdmin;

  return (
    <div className={cn("flex w-full", isAdmin ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "relative h-auto max-w-[min(85%,28rem)] shrink-0 rounded-lg shadow-sm",
          isAdmin
            ? "border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900"
            : "border border-blue-700 bg-blue-600 px-4 py-3 text-white"
        )}
      >
        {message.imageUrl ? (
          <div className="mb-2 overflow-hidden rounded-md border border-slate-200">
            <Image
              src={fileHrefForStoredUrl(message.imageUrl)}
              alt="Прикреплённое изображение"
              width={400}
              height={300}
              className="h-auto max-w-full object-contain"
              unoptimized
            />
          </div>
        ) : null}
        {message.text ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {renderMessageText(message.text, isAdmin)}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-1.5 text-right text-xs",
            isAdmin ? "text-slate-400" : "text-blue-100"
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function QuestionsChat({
  question: initialQuestion,
  className,
}: QuestionsChatProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  const lastMessageIdsRef = useRef<Set<string>>(
    new Set(question.messages.map((m) => m.id))
  );
  const shouldAutoScrollRef = useRef(false);
  const isInitialMountRef = useRef(true);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage, adjustTextareaHeight]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      requestAnimationFrame(() => {
        scrollToBottom();
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 200);
      });
      lastMessageIdsRef.current = new Set(question.messages.map((m) => m.id));
      return;
    }

    const currentMessageIds = new Set(question.messages.map((m) => m.id));
    const hasNewMessages = question.messages.some(
      (m) => !lastMessageIdsRef.current.has(m.id)
    );

    if (hasNewMessages) {
      if (shouldAutoScrollRef.current || isNearBottom()) {
        setTimeout(() => scrollToBottom(), 100);
      }
      lastMessageIdsRef.current = currentMessageIds;
      shouldAutoScrollRef.current = false;
    }
  }, [question.messages]);

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
              if (
                data.question.messages.length > oldMessageCount &&
                wasNearBottom
              ) {
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
    if ((!newMessage.trim() && !selectedImage) || isLoading || isUploadingImage)
      return;

    setIsLoading(true);
    let imageUrl: string | null = null;

    try {
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

      const response = await fetch("/api/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newMessage.trim() || "",
          imageUrl,
        }),
      });

      if (response.ok) {
        shouldAutoScrollRef.current = true;
        setNewMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        router.refresh();
        const refreshResponse = await fetch("/api/questions/list");
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.question) {
            setQuestion(refreshData.question);
          }
        }
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при отправке сообщения");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ошибка при отправке сообщения");
      setIsUploadingImage(false);
    } finally {
      setIsLoading(false);
    }
  };

  const canSend =
    !isLoading &&
    !isUploadingImage &&
    (newMessage.trim().length > 0 || !!selectedImage);

  return (
    <DashboardCard
      className={cn(
        "flex min-h-[280px] flex-col overflow-hidden bg-white shadow-sm",
        className
      )}
    >
      <DashboardCardBody className="flex min-h-0 flex-1 flex-col p-0">
        <div
          ref={messagesContainerRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-50/90 scroll-smooth"
        >
          {question.messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-4 pb-4 pt-4 text-slate-500">
              <MessageSquare
                className="mb-3 h-10 w-10 text-slate-300"
                strokeWidth={1.5}
              />
              <p className="text-sm">Пока нет сообщений. Задайте первый вопрос.</p>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-4 px-4 pb-4 pt-4">
              {question.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(15,23,42,0.06)]">
          {imagePreview ? (
            <div className="relative mb-2 inline-block">
              <div className="relative h-20 w-20 overflow-hidden rounded-none border border-slate-200">
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
                className="absolute -right-1 -top-1 rounded-none border border-slate-200 bg-white p-0.5 text-slate-600 hover:bg-slate-50"
                aria-label="Убрать изображение"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <div
              className={cn(
                "flex items-center gap-2 rounded-none border border-slate-200 bg-white py-2 pl-2 pr-3 shadow-sm transition-colors",
                "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploadingImage}
                title="Прикрепить изображение"
                className={cn(
                  dashboardButtonClass,
                  "h-7 w-7 shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onInput={adjustTextareaHeight}
                placeholder="Введите сообщение…"
                rows={1}
                disabled={isLoading || isUploadingImage}
                className="max-h-28 min-h-[1.25rem] flex-1 resize-none self-center rounded-none border-0 bg-transparent py-0 text-sm leading-snug text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />

              <Button
                type="submit"
                disabled={!canSend}
                size="icon"
                className={cn(
                  dashboardButtonClass,
                  "h-7 w-7 shrink-0 rounded-none bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                )}
                title="Отправить"
              >
                {isLoading || isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {isUploadingImage ? (
            <p className="mt-1.5 text-xs text-slate-500">Загрузка изображения…</p>
          ) : null}
        </div>
      </DashboardCardBody>
    </DashboardCard>
  );
}
