"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, MessageSquare } from "lucide-react";

interface CompletedApplicationDetailsProps {
  application: {
    id: string;
    status: string;
    description: string | null;
    files?: Array<{
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: Date | string;
    }>;
  };
  isTechnicalConditions?: boolean;
}

export function CompletedApplicationDetails({ application, isTechnicalConditions = false }: CompletedApplicationDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Извлекаем данные заявки и комментарий из description
  const getApplicationData = () => {
    if (!application.description) return { data: null, comment: null };
    
    let data: any = null;
    let comment: string | null = null;
    
    try {
      // Пытаемся найти JSON в начале строки (до комментария)
      let jsonPart = application.description;
      
      // Если есть комментарий, извлекаем только JSON часть
      const commentIndex = application.description.indexOf('\n\nКомментарий при завершении:');
      if (commentIndex !== -1) {
        jsonPart = application.description.substring(0, commentIndex).trim();
        const commentText = application.description.substring(commentIndex + 2).replace(/^Комментарий при завершении:\s*/, '').trim();
        comment = commentText || null;
      }
      
      // Пытаемся распарсить JSON
      data = JSON.parse(jsonPart);
    } catch (e) {
      // Не JSON, значит это обычная заявка
      // Проверяем, есть ли комментарий в обычном тексте
      const commentMatch = application.description.match(/Комментарий при завершении:\s*(.+)/s);
      if (commentMatch) {
        comment = commentMatch[1].trim();
      }
    }
    
    return { data, comment };
  };

  const { data: applicationData, comment: completionComment } = getApplicationData();
  const isTechnicalConditions = applicationData && applicationData.type === "technical_conditions";
  const hasFiles = application.files && application.files.length > 0;
  const files = application.files || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Подробнее
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали завершенной заявки</DialogTitle>
          <DialogDescription>
            {isTechnicalConditions 
              ? "Информация о завершенной заявке на технические условия"
              : "Информация о завершенной заявке"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Данные заявки на технические условия */}
          {isTechnicalConditions && applicationData && applicationData.type === "technical_conditions" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Данные заявки</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ФИО:</span>
                  <span className="ml-2 font-medium">
                    {[applicationData.lastName, applicationData.firstName, applicationData.middleName]
                      .filter(Boolean)
                      .join(" ") || "не указано"}
                  </span>
                </div>
                {applicationData.objectAddress && (
                  <div>
                    <span className="text-gray-600">Адрес объекта:</span>
                    <span className="ml-2 font-medium">{applicationData.objectAddress}</span>
                  </div>
                )}
                {applicationData.cadastralNumber && (
                  <div>
                    <span className="text-gray-600">Кадастровый номер:</span>
                    <span className="ml-2 font-medium">{applicationData.cadastralNumber}</span>
                  </div>
                )}
                {applicationData.area && (
                  <div>
                    <span className="text-gray-600">Площадь:</span>
                    <span className="ml-2 font-medium">{applicationData.area} м²</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Тип подключения:</span>
                  <span className="ml-2 font-medium">
                    {applicationData.connectionTypeWater && applicationData.connectionTypeSewerage
                      ? "Водоснабжение и водоотведение"
                      : applicationData.connectionTypeWater
                      ? "Водоснабжение"
                      : applicationData.connectionTypeSewerage
                      ? "Водоотведение"
                      : "не указано"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Комментарий администратора */}
          {completionComment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Комментарий администратора</h3>
                  <p className="text-blue-800 whitespace-pre-wrap">{completionComment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Документы от администратора */}
          {hasFiles ? (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Документы от администратора ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(file.fileSize / 1024).toFixed(1)} KB • 
                          Загружено {new Date(file.uploadedAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-3 flex-shrink-0">
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Документы не загружены</p>
            </div>
          )}

          {!completionComment && !hasFiles && (
            <div className="text-center text-gray-500 py-8">
              <p>Дополнительная информация отсутствует</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

