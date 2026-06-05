"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  adminFieldClass,
  adminOutlineBtnClass,
  adminPrimaryBtnClass,
} from "@/components/admin/admin-styles";
import { siteTextareaClass } from "@/components/site/site-styles";

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

      const validFiles: File[] = [];
      const maxSize = 10 * 1024 * 1024;

      for (const file of newFiles) {
        if (file.size > maxSize) {
          setError(`Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ). Максимальный размер: 10 МБ`);
          continue;
        }
        if (file.size === 0) {
          setError(`Файл "${file.name}" пустой`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        setError(null);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (isTechnicalConditions && files.length === 0) {
      setError("Для завершения заявки на технические условия необходимо загрузить хотя бы один документ");
      setIsSubmitting(false);
      return;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024;
    if (totalSize > maxTotalSize) {
      setError(`Общий размер всех файлов (${(totalSize / 1024 / 1024).toFixed(2)} МБ) превышает максимальный лимит 50 МБ`);
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("status", "COMPLETED");
      if (comment.trim()) {
        formData.append("comment", comment.trim());
      }

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/applications/complete", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Ошибка при завершении заявки";

        if (response.status === 413) {
          errorMessage = "Файл слишком большой. Максимальный размер одного файла: 10 МБ. Общий размер всех файлов не должен превышать 50 МБ. Пожалуйста, уменьшите размер файлов или загрузите их по одному.";
          throw new Error(errorMessage);
        }

        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Завершить заявку</DialogTitle>
          <DialogDescription>
            {isTechnicalConditions
              ? "Загрузите документы и оставьте комментарий для завершения заявки на технические условия"
              : "Оставьте комментарий и загрузите документы (если необходимо) для завершения заявки"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-slate-700">Комментарий</Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий к завершению заявки..."
              rows={4}
              className={cn(siteTextareaClass, "w-full resize-none px-3 py-2 text-sm")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">
              Документы {isTechnicalConditions && <span className="text-red-500">*</span>}
            </Label>
            <div className="border border-dashed border-slate-200 bg-slate-50/50 p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-8 w-8 text-slate-400" />
                <div className="text-center">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer font-medium text-blue-600 hover:text-blue-700"
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
                  <p className="mt-1 text-xs text-slate-500">
                    PDF, DOC, DOCX, JPG, PNG (макс. 10 МБ на файл, общий размер до 50 МБ)
                    {isTechnicalConditions && (
                      <span className="mt-1 block font-medium text-red-600">
                        * Обязательно для завершения заявки на технические условия
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border border-slate-100 bg-white p-2"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="truncate text-sm text-slate-700">{file.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} МБ)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                        className={cn(adminOutlineBtnClass, "h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700")}
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
            <div className="border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className={adminOutlineBtnClass}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className={adminPrimaryBtnClass}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
