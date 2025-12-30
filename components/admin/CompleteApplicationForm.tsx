"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CompleteApplicationFormProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  isTechnicalConditions?: boolean;
}

export function CompleteApplicationForm({
  applicationId,
  isOpen,
  onClose,
  isTechnicalConditions = false,
}: CompleteApplicationFormProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("status", "COMPLETED");
      if (comment.trim()) {
        formData.append("comment", comment.trim());
      }

      // Загружаем файлы
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/applications/complete", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка при завершении заявки");
      }

      // Закрываем форму и обновляем страницу
      setComment("");
      setFiles([]);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при завершении заявки");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setComment("");
      setFiles([]);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Завершить заявку</DialogTitle>
          <DialogDescription>
            {isTechnicalConditions
              ? "Загрузите документы и оставьте комментарий для завершения заявки на технические условия"
              : "Оставьте комментарий и загрузите документы (если необходимо) для завершения заявки"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Комментарий */}
          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий к завершению заявки..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Загрузка файлов */}
          <div className="space-y-2">
            <Label>Документы</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-8 w-8 text-gray-400" />
                <div className="text-center">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Нажмите для загрузки файлов
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG (макс. 10 МБ на файл)
                  </p>
                </div>
              </div>

              {/* Список загруженных файлов */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} МБ)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || files.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Завершение...
                </>
              ) : (
                "Завершить заявку"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

