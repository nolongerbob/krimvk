"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, User, CheckCircle, Clock, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  messages: Message[];
  _count?: {
    messages: number;
  };
}

interface AdminQuestionsChatProps {
  questions: Question[];
}

export function AdminQuestionsChat({ questions: initialQuestions }: AdminQuestionsChatProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuestions.find((q) => q.status !== "COMPLETED")?.id || initialQuestions[0]?.id || null
  );
  const [message, setMessage] = useState("");
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

  // Скроллим вниз только при смене диалога или отправке сообщения
  const lastSelectedQuestionIdRef = useRef(selectedQuestionId);
  const lastMessageIdsRef = useRef<{ [key: string]: Set<string> }>({});
  const shouldAutoScrollRef = useRef(false);

  useEffect(() => {
    const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
    if (!selectedQuestion) return;

    // При смене диалога - скроллим вниз
    if (selectedQuestionId !== lastSelectedQuestionIdRef.current) {
      lastSelectedQuestionIdRef.current = selectedQuestionId;
      setTimeout(() => scrollToBottom(), 100);
      if (selectedQuestionId) {
        lastMessageIdsRef.current[selectedQuestionId] = new Set(selectedQuestion.messages.map(m => m.id));
      }
      return;
    }

    // Проверяем, есть ли новые сообщения по ID
    if (!selectedQuestionId) return;
    
    const currentMessageIds = new Set(selectedQuestion.messages.map(m => m.id));
    const lastMessageIds = lastMessageIdsRef.current[selectedQuestionId] || new Set<string>();
    const hasNewMessages = selectedQuestion.messages.some(m => !lastMessageIds.has(m.id));

    if (hasNewMessages) {
      // Если это наше сообщение или пользователь был внизу - скроллим
      if (shouldAutoScrollRef.current || isNearBottom()) {
        setTimeout(() => scrollToBottom(), 100);
      }
      lastMessageIdsRef.current[selectedQuestionId] = currentMessageIds;
      shouldAutoScrollRef.current = false;
    }
  }, [selectedQuestionId, questions]);

  // Автоматическое обновление вопросов каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/questions/list");
        if (response.ok) {
          const data = await response.json();
          // Сохраняем выбранный диалог при обновлении
          const currentSelectedId = selectedQuestionId;
          const wasNearBottom = isNearBottom();
          const currentQuestion = questions.find((q) => q.id === currentSelectedId);
          const oldMessageIds = currentQuestion ? new Set(currentQuestion.messages.map(m => m.id)) : new Set<string>();

          setQuestions(data.questions);

          // Если выбранный диалог все еще существует, сохраняем его
          if (currentSelectedId && !data.questions.find((q: Question) => q.id === currentSelectedId)) {
            // Если выбранный диалог исчез, выбираем первый доступный
            const firstAvailable = data.questions.find((q: Question) => q.status !== "COMPLETED") || data.questions[0];
            if (firstAvailable) {
              setSelectedQuestionId(firstAvailable.id);
            }
          } else if (currentSelectedId) {
            // Проверяем, появились ли новые сообщения в текущем диалоге
            const updatedQuestion = data.questions.find((q: Question) => q.id === currentSelectedId);
            if (updatedQuestion) {
              const hasNewMessages = updatedQuestion.messages.some((m: Message) => !oldMessageIds.has(m.id));
              if (hasNewMessages && wasNearBottom) {
                setTimeout(() => scrollToBottom(), 100);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedQuestionId]);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId || ((!message.trim() && !selectedImage) || isLoading || isUploadingImage)) return;

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
      const response = await fetch("/api/admin/questions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          questionId: selectedQuestionId, 
          text: message.trim() || "",
          imageUrl 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Помечаем, что нужно скроллить (это наше сообщение)
        shouldAutoScrollRef.current = true;
        // Очищаем форму
        setMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Обновляем диалог с новым сообщением
        setQuestions(
          questions.map((q) =>
            q.id === selectedQuestionId
              ? { ...q, messages: [...q.messages, data.message], updatedAt: new Date(), status: "IN_PROGRESS" }
              : q
          )
        );
        router.refresh();
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

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedQuestionId || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/questions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedQuestionId, status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        // Обновляем статус, но сохраняем выбранный диалог
        const updatedStatus = data.status || newStatus;
        setQuestions(
          questions.map((q) =>
            q.id === selectedQuestionId
              ? { ...q, status: updatedStatus, updatedAt: new Date() }
              : q
          )
        );
        // Не меняем selectedQuestionId - диалог остается выбранным
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при изменении статуса");
      }
    } catch (error) {
      alert("Ошибка при изменении статуса");
    } finally {
      setIsLoading(false);
    }
  };

  const pendingQuestions = questions.filter((q) => q.status === "PENDING");
  const inProgressQuestions = questions.filter((q) => q.status === "IN_PROGRESS");
  const completedQuestions = questions.filter((q) => q.status === "COMPLETED");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Список диалогов */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-semibold">Диалоги</h3>
            </div>
            <div className="divide-y flex-1 overflow-y-auto min-h-0">
              {inProgressQuestions.length > 0 && (
                <div className="p-2 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-700">В работе ({inProgressQuestions.length})</p>
                </div>
              )}
              {inProgressQuestions.map((q) => {
                const lastMessage = q.messages[q.messages.length - 1];
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedQuestionId === q.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{q.user.name || q.user.email}</p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate">{lastMessage.text}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(q.updatedAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {pendingQuestions.length > 0 && (
                <div className="p-2 bg-yellow-50">
                  <p className="text-xs font-semibold text-yellow-700">Ожидают ответа ({pendingQuestions.length})</p>
                </div>
              )}
              {pendingQuestions.map((q) => {
                const lastMessage = q.messages[q.messages.length - 1];
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedQuestionId === q.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{q.user.name || q.user.email}</p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate">{lastMessage.text}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(q.updatedAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {completedQuestions.length > 0 && (
                <div className="p-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700">Завершенные ({completedQuestions.length})</p>
                </div>
              )}
              {completedQuestions.map((q) => {
                const lastMessage = q.messages[q.messages.length - 1];
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedQuestionId === q.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{q.user.name || q.user.email}</p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate">{lastMessage.text}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(q.updatedAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Чат с выбранным диалогом */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {selectedQuestion ? (
              <>
                {/* История сообщений */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  <div className="mb-4 pb-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedQuestion.user.name || selectedQuestion.user.email}</p>
                        <p className="text-xs text-gray-500">
                          Диалог создан: {new Date(selectedQuestion.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedQuestion.messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Нет сообщений в этом диалоге</p>
                    </div>
                  ) : (
                    selectedQuestion.messages.map((message) => (
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
                          {message.isFromAdmin && (
                            <p className="text-xs text-gray-500 mb-1">Вы (Администратор)</p>
                          )}
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

                {/* Форма отправки сообщения и управления статусом */}
                <div className="border-t p-4 space-y-2 flex-shrink-0 bg-white">
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
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Введите сообщение..."
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
                        disabled={isLoading || isUploadingImage || (!message.trim() && !selectedImage)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  {isUploadingImage && (
                    <p className="text-xs text-gray-500">Загрузка изображения...</p>
                  )}
                  <div className="flex gap-2">
                    {selectedQuestion.status === "PENDING" && (
                      <Button
                        onClick={() => handleStatusChange("IN_PROGRESS")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                      >
                        {isLoading ? "Обновление..." : "Взять в работу"}
                      </Button>
                    )}
                    {selectedQuestion.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => handleStatusChange("COMPLETED")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                      >
                        {isLoading ? "Обновление..." : "Завершить диалог"}
                      </Button>
                    )}
                    {selectedQuestion.status === "COMPLETED" && (
                      <Button
                        onClick={() => handleStatusChange("PENDING")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                      >
                        {isLoading ? "Обновление..." : "Вернуть в ожидание"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Выберите диалог</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
