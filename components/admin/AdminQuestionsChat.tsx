"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  X,
  Plus,
  Pencil,
  Trash2,
  Search,
  BookOpen,
  MessageSquareText,
  ChevronRight,
  GripVertical,
  PanelLeftClose,
  PanelRightClose,
  Sparkles,
  Loader2,
  Database,
} from "lucide-react";
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
}

interface Template {
  id: string;
  title: string;
  content: string;
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Размеры панелей (в пикселях)
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(380);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);

  // Минимальные и максимальные размеры
  const MIN_LEFT = 200;
  const MAX_LEFT = 500;
  const MIN_RIGHT = 250;
  const MAX_RIGHT = 600;

  // Обработка изменения размеров
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (isDragging === "left") {
        const newWidth = e.clientX - containerRect.left;
        setLeftWidth(Math.min(MAX_LEFT, Math.max(MIN_LEFT, newWidth)));
      } else if (isDragging === "right") {
        const newWidth = containerRect.right - e.clientX;
        setRightWidth(Math.min(MAX_RIGHT, Math.max(MIN_RIGHT, newWidth)));
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Шаблоны и база знаний
  const [templates, setTemplates] = useState<Template[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [rightTab, setRightTab] = useState<"templates" | "knowledge">("templates");
  const [searchRight, setSearchRight] = useState("");

  // Редактирование
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // AI генерация
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToKnowledge, setIsAddingToKnowledge] = useState(false);

  // Загрузка шаблонов и статей
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesRes, articlesRes] = await Promise.all([
          fetch("/api/admin/templates"),
          fetch("/api/admin/knowledge-base"),
        ]);
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates || []);
        }
        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Фильтрация
  const filteredTemplates = templates.filter(
    (t) =>
      !searchRight ||
      t.title.toLowerCase().includes(searchRight.toLowerCase()) ||
      t.content.toLowerCase().includes(searchRight.toLowerCase())
  );

  const filteredArticles = articles.filter(
    (a) =>
      !searchRight ||
      a.title.toLowerCase().includes(searchRight.toLowerCase()) ||
      a.content.toLowerCase().includes(searchRight.toLowerCase())
  );

  // CRUD шаблонов
  const saveTemplate = async () => {
    if (!newItemTitle.trim() || !newItemContent.trim()) return;
    try {
      const method = editingTemplate ? "PUT" : "POST";
      const body = editingTemplate
        ? { id: editingTemplate.id, title: newItemTitle, content: newItemContent }
        : { title: newItemTitle, content: newItemContent };

      const res = await fetch("/api/admin/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingTemplate) {
          setTemplates(templates.map((t) => (t.id === data.template.id ? data.template : t)));
        } else {
          setTemplates([data.template, ...templates]);
        }
        resetForm();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    try {
      const res = await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  // CRUD статей базы знаний
  const saveArticle = async () => {
    if (!newItemTitle.trim() || !newItemContent.trim()) return;
    try {
      const method = editingArticle ? "PUT" : "POST";
      const body = editingArticle
        ? { id: editingArticle.id, title: newItemTitle, content: newItemContent }
        : { title: newItemTitle, content: newItemContent };

      const res = await fetch("/api/admin/knowledge-base", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingArticle) {
          setArticles(articles.map((a) => (a.id === data.article.id ? data.article : a)));
        } else {
          setArticles([data.article, ...articles]);
        }
        resetForm();
      }
    } catch (error) {
      console.error("Error saving article:", error);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Удалить статью?")) return;
    try {
      const res = await fetch(`/api/admin/knowledge-base?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setEditingArticle(null);
    setNewItemTitle("");
    setNewItemContent("");
    setShowAddForm(false);
  };

  const startEditTemplate = (t: Template) => {
    setEditingTemplate(t);
    setEditingArticle(null);
    setNewItemTitle(t.title);
    setNewItemContent(t.content);
    setShowAddForm(true);
  };

  const startEditArticle = (a: KBArticle) => {
    setEditingArticle(a);
    setEditingTemplate(null);
    setNewItemTitle(a.title);
    setNewItemContent(a.content);
    setShowAddForm(true);
  };

  const insertText = (text: string) => {
    setMessage((prev) => (prev ? prev + "\n\n" + text : text));
  };

  // Генерация ответа с помощью AI
  const generateAIResponse = async () => {
    if (!selectedQuestion || isGenerating) return;

    // Получаем последнее сообщение клиента
    const lastUserMessage = [...selectedQuestion.messages]
      .reverse()
      .find((m) => !m.isFromAdmin);

    if (!lastUserMessage) {
      alert("Нет сообщений от клиента для анализа");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/ai/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          userMessage: lastUserMessage.text,
          currentDraft: message.trim(), // Если есть черновик - отправляем для улучшения
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          setMessage(data.response);
          // Обновляем высоту textarea
          if (textareaRef.current) {
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + "px";
              }
            }, 0);
          }
        }
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при генерации ответа");
      }
    } catch (error) {
      console.error("Error generating response:", error);
      alert("Ошибка при генерации ответа");
    } finally {
      setIsGenerating(false);
    }
  };

  // Добавление кейса в базу знаний через AI
  const addToKnowledgeBase = async () => {
    if (!selectedQuestion || isAddingToKnowledge) return;

    // Проверяем, есть ли хотя бы один ответ админа
    const hasAdminResponse = selectedQuestion.messages.some((m) => m.isFromAdmin);
    if (!hasAdminResponse) {
      alert("Сначала ответьте на вопрос клиента");
      return;
    }

    setIsAddingToKnowledge(true);

    try {
      const response = await fetch("/api/admin/ai/add-to-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          messages: selectedQuestion.messages.map((m) => ({
            text: m.text,
            isFromAdmin: m.isFromAdmin,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Добавляем созданные записи в локальное состояние
        if (data.article) {
          setArticles((prev) => [data.article, ...prev]);
        }
        if (data.template) {
          setTemplates((prev) => [data.template, ...prev]);
        }

        alert(
          `Добавлено в базу знаний!\n` +
          (data.article ? `• Статья: "${data.article.title}"\n` : "") +
          (data.template ? `• Шаблон: "${data.template.title}"` : "")
        );
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при добавлении в базу знаний");
      }
    } catch (error) {
      console.error("Error adding to knowledge base:", error);
      alert("Ошибка при добавлении в базу знаний");
    } finally {
      setIsAddingToKnowledge(false);
    }
  };

  // Чат функции
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  };

  const lastSelectedQuestionIdRef = useRef(selectedQuestionId);

  useEffect(() => {
    if (selectedQuestionId !== lastSelectedQuestionIdRef.current) {
      lastSelectedQuestionIdRef.current = selectedQuestionId;
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedQuestionId]);

  // Автообновление
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/questions/list");
        if (response.ok) {
          const data = await response.json();
          const wasNearBottom = isNearBottom();
          setQuestions(data.questions);
          if (wasNearBottom) {
            setTimeout(() => scrollToBottom(), 100);
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId || ((!message.trim() && !selectedImage) || isLoading)) return;

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
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
          console.log("Image uploaded:", imageUrl);
        } else {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error("Upload failed:", errorData);
          alert("Ошибка при загрузке изображения: " + (errorData.error || "Неизвестная ошибка"));
          setIsUploadingImage(false);
          setIsLoading(false);
          return; // Прерываем отправку если картинка не загрузилась
        }
        setIsUploadingImage(false);
      }

      const response = await fetch("/api/admin/questions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedQuestionId, text: message.trim(), imageUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("");
        removeImage();
        // Сброс высоты textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        setQuestions(
          questions.map((q) =>
            q.id === selectedQuestionId
              ? { ...q, messages: [...q.messages, data.message], status: "IN_PROGRESS" }
              : q
          )
        );
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
        setQuestions(questions.map((q) => (q.id === selectedQuestionId ? { ...q, status: newStatus } : q)));
      }
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingQuestions = questions.filter((q) => q.status === "PENDING");
  const inProgressQuestions = questions.filter((q) => q.status === "IN_PROGRESS");
  const completedQuestions = questions.filter((q) => q.status === "COMPLETED");

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-80px)]">
      {/* ЛЕВАЯ КОЛОНКА - Список чатов */}
      <div
        style={{ width: isLeftCollapsed ? 48 : leftWidth }}
        className="flex-shrink-0 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden transition-all duration-200"
      >
        {isLeftCollapsed ? (
          <button
            onClick={() => setIsLeftCollapsed(false)}
            className="h-full flex items-center justify-center hover:bg-gray-50"
            title="Развернуть панель"
          >
            <PanelLeftClose className="h-5 w-5 text-gray-400 rotate-180" />
          </button>
        ) : (
          <>
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Диалоги</h2>
                <p className="text-xs text-gray-500">{questions.length} всего</p>
              </div>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Свернуть"
              >
                <PanelLeftClose className="h-4 w-4 text-gray-500" />
              </button>
            </div>
        <div className="flex-1 overflow-y-auto">
          {/* В работе */}
          {inProgressQuestions.length > 0 && (
            <>
              <div className="px-3 py-2 bg-blue-50 text-xs font-semibold text-blue-700 sticky top-0">
                В работе ({inProgressQuestions.length})
              </div>
              {inProgressQuestions.map((q) => (
                <ChatListItem
                  key={q.id}
                  question={q}
                  isSelected={selectedQuestionId === q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  icon={<AlertCircle className="h-4 w-4 text-blue-500" />}
                />
              ))}
            </>
          )}
          {/* Ожидают */}
          {pendingQuestions.length > 0 && (
            <>
              <div className="px-3 py-2 bg-yellow-50 text-xs font-semibold text-yellow-700 sticky top-0">
                Ожидают ответа ({pendingQuestions.length})
              </div>
              {pendingQuestions.map((q) => (
                <ChatListItem
                  key={q.id}
                  question={q}
                  isSelected={selectedQuestionId === q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  icon={<Clock className="h-4 w-4 text-yellow-500" />}
                />
              ))}
            </>
          )}
          {/* Завершённые */}
          {completedQuestions.length > 0 && (
            <>
              <div className="px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0">
                Завершённые ({completedQuestions.length})
              </div>
              {completedQuestions.map((q) => (
                <ChatListItem
                  key={q.id}
                  question={q}
                  isSelected={selectedQuestionId === q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  icon={<CheckCircle className="h-4 w-4 text-gray-400" />}
                />
              ))}
            </>
          )}
        </div>
          </>
        )}
      </div>

      {/* Разделитель между левой и центральной колонкой */}
      {!isLeftCollapsed && (
        <div
          className="w-2 flex-shrink-0 cursor-col-resize flex items-center justify-center hover:bg-blue-100 transition-colors group"
          onMouseDown={() => setIsDragging("left")}
        >
          <GripVertical className="h-6 w-6 text-gray-300 group-hover:text-blue-400" />
        </div>
      )}

      {/* ЦЕНТРАЛЬНАЯ КОЛОНКА - Чат */}
      <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden min-w-0">
        {selectedQuestion ? (
          <>
            {/* Шапка чата */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <p className="font-semibold">{selectedQuestion.user.name || selectedQuestion.user.email}</p>
                <p className="text-xs text-gray-500">
                  Создан: {new Date(selectedQuestion.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedQuestion.status === "PENDING" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange("IN_PROGRESS")}>
                    Взять в работу
                  </Button>
                )}
                {selectedQuestion.status === "IN_PROGRESS" && (
                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange("COMPLETED")}>
                    Завершить
                  </Button>
                )}
                {selectedQuestion.status === "COMPLETED" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange("PENDING")}>
                    Вернуть
                  </Button>
                )}
              </div>
            </div>

            {/* Сообщения */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedQuestion.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`rounded-xl px-4 py-2 max-w-[75%] ${
                      msg.isFromAdmin ? "bg-gray-100 text-gray-900" : "bg-blue-500 text-white"
                    }`}
                  >
                    {msg.isFromAdmin && <p className="text-xs text-gray-500 mb-1">Вы</p>}
                    {msg.imageUrl && (
                      <Image src={msg.imageUrl} alt="" width={300} height={200} className="rounded-lg mb-2" unoptimized />
                    )}
                    {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                    <p className={`text-xs mt-1 ${msg.isFromAdmin ? "text-gray-400" : "text-blue-100"}`}>
                      {new Date(msg.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма отправки */}
            <div className="p-4 border-t bg-white">
              {/* Кнопки AI */}
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAIResponse}
                  disabled={isGenerating || !selectedQuestion?.messages.some((m) => !m.isFromAdmin)}
                  className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {message.trim() ? "Улучшение..." : "Генерация..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      {message.trim() ? "Улучшить ответ (AI)" : "Сгенерировать ответ (AI)"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addToKnowledgeBase}
                  disabled={isAddingToKnowledge || !selectedQuestion?.messages.some((m) => m.isFromAdmin)}
                  className="gap-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200"
                  title="AI сформирует статью в базе знаний и шаблон ответа на основе этого диалога"
                >
                  {isAddingToKnowledge ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Добавление...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 text-green-600" />
                      В базу знаний (AI)
                    </>
                  )}
                </Button>
                {message.trim() && (
                  <span className="text-xs text-gray-500 self-center">
                    AI улучшит ваш черновик
                  </span>
                )}
              </div>
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <Image src={imagePreview} alt="" width={100} height={100} className="rounded-lg border" unoptimized />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    // Автоматическое расширение
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + "px";
                  }}
                  placeholder="Введите сообщение..."
                  className="flex-1 min-h-[60px] max-h-[300px] resize-y"
                  rows={2}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button type="submit" disabled={isLoading || (!message.trim() && !selectedImage)}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Выберите диалог</p>
            </div>
          </div>
        )}
      </div>

      {/* Разделитель между центральной и правой колонкой */}
      {!isRightCollapsed && (
        <div
          className="w-2 flex-shrink-0 cursor-col-resize flex items-center justify-center hover:bg-blue-100 transition-colors group"
          onMouseDown={() => setIsDragging("right")}
        >
          <GripVertical className="h-6 w-6 text-gray-300 group-hover:text-blue-400" />
        </div>
      )}

      {/* ПРАВАЯ КОЛОНКА - Шаблоны и База знаний */}
      <div
        style={{ width: isRightCollapsed ? 48 : rightWidth }}
        className="flex-shrink-0 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden transition-all duration-200"
      >
        {isRightCollapsed ? (
          <button
            onClick={() => setIsRightCollapsed(false)}
            className="h-full flex items-center justify-center hover:bg-gray-50"
            title="Развернуть панель"
          >
            <PanelRightClose className="h-5 w-5 text-gray-400 rotate-180" />
          </button>
        ) : (
          <>
        {/* Табы */}
        <div className="flex border-b">
          <button
            onClick={() => { setRightTab("templates"); resetForm(); }}
            className={`flex-1 px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${
              rightTab === "templates" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageSquareText className="h-4 w-4" />
            <span className="hidden sm:inline">Шаблоны</span>
          </button>
          <button
            onClick={() => { setRightTab("knowledge"); resetForm(); }}
            className={`flex-1 px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${
              rightTab === "knowledge" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">База знаний</span>
          </button>
          <button
            onClick={() => setIsRightCollapsed(true)}
            className="px-2 py-2.5 hover:bg-gray-100 border-l"
            title="Свернуть"
          >
            <PanelRightClose className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Поиск и добавление */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск..."
              value={searchRight}
              onChange={(e) => setSearchRight(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {rightTab === "templates" ? "Добавить шаблон" : "Добавить статью"}
          </Button>
        </div>

        {/* Форма добавления/редактирования */}
        {showAddForm && (
          <div className="p-3 border-b bg-gray-50 space-y-2">
            <Input
              placeholder="Название"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
            />
            <Textarea
              placeholder="Содержание"
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={rightTab === "templates" ? saveTemplate : saveArticle}
                disabled={!newItemTitle.trim() || !newItemContent.trim()}
              >
                {editingTemplate || editingArticle ? "Сохранить" : "Добавить"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Список */}
        <div className="flex-1 overflow-y-auto">
          {rightTab === "templates" ? (
            filteredTemplates.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Нет шаблонов</p>
            ) : (
              filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="p-3 border-b hover:bg-gray-50 group cursor-pointer"
                  onClick={() => insertText(t.content)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.content}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditTemplate(t); }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Pencil className="h-3 w-3 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                    <ChevronRight className="h-3 w-3" />
                    <span>Нажмите, чтобы вставить</span>
                  </div>
                </div>
              ))
            )
          ) : filteredArticles.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Нет статей</p>
          ) : (
            filteredArticles.map((a) => (
              <div
                key={a.id}
                className="p-3 border-b hover:bg-gray-50 group cursor-pointer"
                onClick={() => insertText(a.content)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{a.content}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditArticle(a); }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Pencil className="h-3 w-3 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteArticle(a.id); }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                  <ChevronRight className="h-3 w-3" />
                  <span>Нажмите, чтобы вставить</span>
                </div>
              </div>
            ))
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

// Компонент элемента списка чатов
function ChatListItem({
  question,
  isSelected,
  onClick,
  icon,
}: {
  question: Question;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  const lastMessage = question.messages[question.messages.length - 1];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{question.user.name || question.user.email}</p>
          {lastMessage && <p className="text-xs text-gray-500 truncate">{lastMessage.text}</p>}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(question.updatedAt).toLocaleString("ru-RU")}
          </p>
        </div>
      </div>
    </button>
  );
}
